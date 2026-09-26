import type { Response } from 'express';
import { z } from 'zod';
import { moduleService } from '../services/module.service.js';
import { Course } from '../models/Course.model.js';
import { permissions } from '../services/permissions.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/* ─── Schemas ────────────────────────────────────────────────────── */

export const createModuleSchema = z.object({
  params: z.object({ courseSlug: z.string().min(1) }),
  body: z
    .object({
      title: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
      order: z.number().int().min(1).optional(),
    })
    .strict(),
});

export const updateModuleSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    moduleId: z.string().min(1),
  }),
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(500).optional(),
    })
    .strict(),
});

export const moduleParamsSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    moduleId: z.string().min(1),
  }),
});

export const reorderModuleSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    moduleId: z.string().min(1),
  }),
  body: z
    .object({
      order: z.number().int().min(1),
    })
    .strict(),
});

export const assignLessonSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    moduleId: z.string().min(1),
  }),
  body: z
    .object({
      lessonId: z.string().min(1),
    })
    .strict(),
});

export const unassignLessonSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    lessonId: z.string().min(1),
  }),
});

/* ─── Helpers ────────────────────────────────────────────────────── */

/**
 * Resolve the course and the caller's effective role, and assert that
 * the caller can edit content. Throws 403 otherwise.
 *
 * Every mutating module handler funnels through this so the
 * permission check is in exactly one place.
 */
async function requireEditAccess(
  req: AuthRequest,
  courseSlug: string
): Promise<{ courseId: string }> {
  const user = {
    _id: req.user!._id.toString(),
    role: req.user!.role as string,
  };
  const course = await Course.findOne({ slug: courseSlug });
  if (!course) throw new ApiError(404, 'Course not found');

  const role = await permissions.resolveEffectiveRole(
    user,
    course._id.toString()
  );
  if (!permissions.canEditContent(role)) {
    throw new ApiError(403, 'You do not have permission to edit this course');
  }

  return { courseId: course._id.toString() };
}

/* ─── Controllers ────────────────────────────────────────────────── */

export const moduleController = {
  /**
   * GET /instructor/courses/:courseSlug/modules
   *
   * List every module in a course, with its lessons. Used by the
   * instructor editor.
   */
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { courseId } = await requireEditAccess(
      req,
      String(req.params.courseSlug)
    );
    const result = await moduleService.listWithLessons(courseId);
    return ApiResponse.success(res, result);
  }),

  /**
   * POST /instructor/courses/:courseSlug/modules
   */
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { courseId } = await requireEditAccess(
      req,
      String(req.params.courseSlug)
    );
    const created = await moduleService.create({
      courseId,
      title: req.body.title,
      description: req.body.description,
      order: req.body.order,
    });
    return ApiResponse.success(res, created, 'Module created', 201);
  }),

  /**
   * PATCH /instructor/courses/:courseSlug/modules/:moduleId
   */
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireEditAccess(req, String(req.params.courseSlug));
    const updated = await moduleService.update(
      String(req.params.moduleId),
      req.body
    );
    return ApiResponse.success(res, updated, 'Module updated');
  }),

  /**
   * DELETE /instructor/courses/:courseSlug/modules/:moduleId
   *
   * Re-parents lessons to the ungrouped bucket. Does not delete them.
   */
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireEditAccess(req, String(req.params.courseSlug));
    const result = await moduleService.delete(String(req.params.moduleId));
    return ApiResponse.success(
      res,
      result,
      'Module deleted. Lessons were moved to the ungrouped bucket.'
    );
  }),

  /**
   * PATCH /instructor/courses/:courseSlug/modules/:moduleId/order
   */
  reorder: asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireEditAccess(req, String(req.params.courseSlug));
    const updated = await moduleService.reorder(
      String(req.params.moduleId),
      req.body.order
    );
    return ApiResponse.success(res, updated, 'Module reordered');
  }),

  /**
   * POST /instructor/courses/:courseSlug/modules/:moduleId/lessons
   *
   * Assign a lesson to this module.
   */
  assignLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireEditAccess(req, String(req.params.courseSlug));
    const updated = await moduleService.assignLesson(
      String(req.body.lessonId),
      String(req.params.moduleId)
    );
    return ApiResponse.success(res, updated, 'Lesson assigned to module');
  }),

  /**
   * DELETE /instructor/courses/:courseSlug/modules/lessons/:lessonId
   *
   * Remove a lesson from its module. The lesson survives; it moves
   * to the ungrouped bucket.
   */
  unassignLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireEditAccess(req, String(req.params.courseSlug));
    const updated = await moduleService.assignLesson(
      String(req.params.lessonId),
      null
    );
    return ApiResponse.success(res, updated, 'Lesson unassigned');
  }),
};