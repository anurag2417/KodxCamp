import type { Response } from 'express';
import { z } from 'zod';
import { progressService } from '../services/progress.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const markCompleteSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    lessonId: z.string().min(1),
  }),
});

export const markStepCompleteSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    lessonId: z.string().min(1),
    stepIndex: z.number().int().min(0),
  }),
});

export const progressController = {
  getForCourse: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { courseId } = req.params;
    const progress = await progressService.getForCourse(userId, courseId);
    return ApiResponse.success(res, progress);
  }),

  markComplete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { courseId, lessonId } = req.body;
    const progress = await progressService.markLessonComplete(userId, courseId, lessonId);
    return ApiResponse.success(res, progress, 'Lesson marked complete');
  }),

  markStepComplete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { courseId, lessonId, stepIndex } = req.body;
    const progress = await progressService.markStepComplete(
      userId,
      courseId,
      lessonId,
      stepIndex
    );
    return ApiResponse.success(res, progress, 'Step marked complete');
  }),
};