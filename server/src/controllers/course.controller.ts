import type { Request, Response } from 'express';
import { z } from 'zod';
import { courseService } from '../services/course.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const courseSlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const lessonSlugSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    lessonSlug: z.string().min(1),
  }),
});

export const courseController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const courses = await courseService.listAll();
    return ApiResponse.success(res, courses);
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.getBySlug(req.params.slug);
    return ApiResponse.success(res, course);
  }),

  getLesson: asyncHandler(async (req: Request, res: Response) => {
    const { courseSlug, lessonSlug } = req.params;
    const result = await courseService.getLessonBySlug(courseSlug, lessonSlug);
    return ApiResponse.success(res, result);
  }),
};