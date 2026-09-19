import type { Response } from 'express';
import { z } from 'zod';
import { courseService } from '../services/course.service.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const testCaseSchema = z.object({
  input: z.string().default(''),
  expectedOutput: z.string().min(1, 'Expected output is required'),
});

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(120),
    slug: z.string().min(2).max(80),
    description: z.string().min(5).max(1000),
    language: z.string().min(2),
    thumbnail: z.string().optional(),
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(120).optional(),
    slug: z.string().min(2).max(80).optional(),
    description: z.string().min(5).max(1000).optional(),
    language: z.string().min(2).optional(),
    thumbnail: z.string().optional(),
  }),
});

export const lessonSlugSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    lessonSlug: z.string().min(1),
  }),
});

export const courseSlugOnlySchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const createLessonSchema = z.object({
  params: z.object({ courseSlug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(150),
    slug: z.string().min(2).max(80),
    order: z.number().int().min(1).default(1),
    content: z.string().min(1),
    starterCode: z.string().default(''),
    solution: z.string().default(''),
    language: z.string().min(2),
    testCases: z.array(testCaseSchema).default([]),
  }),
});

export const updateLessonSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    lessonSlug: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    slug: z.string().min(2).max(80).optional(),
    order: z.number().int().min(1).optional(),
    content: z.string().min(1).optional(),
    starterCode: z.string().optional(),
    solution: z.string().optional(),
    language: z.string().min(2).optional(),
    testCases: z.array(testCaseSchema).optional(),
  }),
});

export const adminCourseController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const created = await courseService.createCourse(req.body);
    return ApiResponse.success(res, created, 'Course created', 201);
  }),

  /**
   * Admin view of a single course — includes the FULL lesson documents
   * (starterCode, solution, testCases). This is what the admin editor uses.
   */
  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await Course.findOne({ slug: req.params.slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const lessons = await Lesson.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .lean();

    return ApiResponse.success(res, { ...course, lessons });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await courseService.updateCourse(req.params.slug as string, req.body);
    return ApiResponse.success(res, updated, 'Course updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await courseService.deleteCourse(req.params.slug as string);
    return ApiResponse.success(res, result, 'Course deleted');
  }),

  createLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    const created = await courseService.createLesson(req.params.courseSlug as string, req.body);
    return ApiResponse.success(res, created, 'Lesson created', 201);
  }),

  updateLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await courseService.updateLesson(
      req.params.courseSlug as string,
      req.params.lessonSlug as string,
      req.body
    );
    return ApiResponse.success(res, updated, 'Lesson updated');
  }),

  removeLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await courseService.deleteLesson(
      req.params.courseSlug as string,
      req.params.lessonSlug as string
    );
    return ApiResponse.success(res, result, 'Lesson deleted');
  }),
};