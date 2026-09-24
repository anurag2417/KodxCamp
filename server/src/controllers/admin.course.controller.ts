import type { Response } from 'express';
import { z } from 'zod';
import { courseService } from '../services/course.service.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

// ─── Schemas ──────────────────────────────────────────────────────

export const adminCreateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(120),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    description: z.string().min(5).max(1000),
    language: z.string().min(2),
    courseType: z.string().min(2).max(80).default('general'),
    thumbnail: z.string().optional(),
    published: z.boolean().optional(),
  }),
});

export const adminUpdateCourseSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(120).optional(),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().min(5).max(1000).optional(),
    language: z.string().min(2).optional(),
    courseType: z.string().min(2).max(80).optional(),
    thumbnail: z.string().optional(),
    published: z.boolean().optional(),
  }),
});

export const adminCourseSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Every endpoint here is admin-only via the `admin.routes.ts` guard,
 * so we don't need course-team permission checks. We still call
 * through `courseService` for the heavy lifting, and the service's
 * permission resolver short-circuits admins. This keeps validation,
 * slug-collision checks, and membership creation in one place.
 */
async function getCourseOr404(slug: string) {
  const course = await Course.findOne({ slug });
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
}

// ─── Controller ───────────────────────────────────────────────────

export const adminCourseController = {
  /**
   * List every course on the platform, published or not, with a
   * lesson count per course.
   */
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();

    const withCounts = await Promise.all(
      courses.map(async (c) => ({
        ...c,
        totalLessons: await Lesson.countDocuments({
          courseId: c._id.toString(),
        }),
      }))
    );

    return ApiResponse.success(res, withCounts);
  }),

  /**
   * Full course document including every lesson (with solution and
   * test cases). Used by the admin course editor if we ever build one;
   * for now the client uses the instructor endpoint for editing.
   */
  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await Course.findOne({ slug: req.params.slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const lessons = await Lesson.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .lean();

    return ApiResponse.success(res, {
      ...course,
      lessons: lessons.map((l) => ({
        ...l,
        steps: l.steps ?? [],
      })),
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    // `createCourse` in the service enforces admin-only. The admin
    // guard already enforced it, so this call will succeed for every
    // request that reaches here.
    const created = await courseService.createCourse(req, {
      title: req.body.title,
      slug: req.body.slug,
      description: req.body.description,
      language: req.body.language,
      courseType: req.body.courseType,
      thumbnail: req.body.thumbnail,
    });

    // Apply the optional `published` flag in a second write, since
    // `createCourse` hard-codes `published: false`.
    if (req.body.published === true) {
      await Course.updateOne(
        { _id: created._id },
        { $set: { published: true } }
      );
      const refreshed = await Course.findById(created._id).lean();
      return ApiResponse.success(res, refreshed, 'Course created', 201);
    }

    return ApiResponse.success(res, created, 'Course created', 201);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourseOr404(String(req.params.slug));

    if (req.body.slug && req.body.slug !== course.slug) {
      const collision = await Course.findOne({ slug: req.body.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

    Object.assign(course, req.body);
    await course.save();
    return ApiResponse.success(res, course.toObject(), 'Course updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourseOr404(String(req.params.slug));

    const courseId = course._id.toString();

    // Cascade delete. Mirrors what the instructor course delete does,
    // so nothing is left dangling.
    const { Progress } = await import('../models/Progress.model.js');
    const { CourseMembership } = await import(
      '../models/CourseMembership.model.js'
    );

    await Promise.all([
      Lesson.deleteMany({ courseId }),
      Progress.deleteMany({ courseId }),
      CourseMembership.deleteMany({ courseId }),
      Course.deleteOne({ _id: course._id }),
    ]);

    return ApiResponse.success(res, { ok: true }, 'Course deleted');
  }),
};