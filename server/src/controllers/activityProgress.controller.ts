import type { Response } from 'express';
import { z } from 'zod';

import {
  activityProgressService,
} from '../services/activityProgress.service.js';

import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const activityProgressParamsSchema =
  z.object({
    params: z.object({
      courseId: z.string().min(1),
      curriculumItemId: z.string().min(1),
    }),
  });

export const activityProgressCourseSchema =
  z.object({
    params: z.object({
      courseId: z.string().min(1),
    }),
  });

export const sectionProgressParamsSchema =
  z.object({
    params: z.object({
      courseId: z.string().min(1),
      sectionId: z.string().min(1),
    }),
  });

export const moduleProgressParamsSchema =
  z.object({
    params: z.object({
      courseId: z.string().min(1),
      moduleId: z.string().min(1),
    }),
  });

export const courseProgressParamsSchema =
  z.object({
    params: z.object({
      courseId: z.string().min(1),
    }),
  });

export const startActivitySchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    curriculumItemId: z.string().min(1),
  }),
});

export const updateActivityProgressSchema =
  z.object({
    body: z.object({
      courseId: z.string().min(1),
      curriculumItemId: z.string().min(1),
      status: z
        .enum([
          'not_started',
          'in_progress',
          'completed',
        ])
        .optional(),
      score: z
        .number()
        .min(0)
        .max(100)
        .optional(),
      timeSpentSeconds: z
        .number()
        .int()
        .min(0)
        .optional(),
      incrementAttempt:
        z.boolean().optional(),
    }),
  });

export const completeActivitySchema =
  z.object({
    body: z.object({
      courseId: z.string().min(1),
      curriculumItemId: z.string().min(1),
      score: z
        .number()
        .min(0)
        .max(100)
        .optional(),
      timeSpentSeconds: z
        .number()
        .int()
        .min(0)
        .optional(),
      incrementAttempt:
        z.boolean().optional(),
    }),
  });

export const activityStepSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    curriculumItemId: z.string().min(1),
    stepIndex: z
      .number()
      .int()
      .min(0),
  }),
});

export const activityChallengeSchema =
  z.object({
    body: z.object({
      courseId: z.string().min(1),
      curriculumItemId: z.string().min(1),
      challengeIndex: z
        .number()
        .int()
        .min(0),
    }),
  });

export const activityProgressController = {
  getForCourse: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const { courseId } = req.params;

      const progress =
        await activityProgressService.getForCourse(
          userId,
          courseId
        );

      return ApiResponse.success(
        res,
        progress
      );
    }
  ),

  getForActivity: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        curriculumItemId,
      } = req.params;

      const progress =
        await activityProgressService.getForActivity(
          userId,
          courseId,
          curriculumItemId
        );

      return ApiResponse.success(
        res,
        progress
      );
    }
  ),

  getCourse: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const { courseId } = req.params;

      const progress =
        await activityProgressService.getCourseProgress(
          userId,
          courseId
        );

      return ApiResponse.success(
        res,
        progress
      );
    }
  ),

  getModule: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        moduleId,
      } = req.params;

      const progress =
        await activityProgressService.getModuleProgress(
          userId,
          courseId,
          moduleId
        );

      return ApiResponse.success(
        res,
        progress
      );
    }
  ),

  getSection: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        sectionId,
      } = req.params;

      const progress =
        await activityProgressService.getSectionProgress(
          userId,
          courseId,
          sectionId
        );

      return ApiResponse.success(
        res,
        progress
      );
    }
  ),

  start: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        curriculumItemId,
      } = req.body;

      const progress =
        await activityProgressService.startActivity(
          userId,
          courseId,
          curriculumItemId
        );

      return ApiResponse.success(
        res,
        progress,
        'Activity started'
      );
    }
  ),

  update: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        curriculumItemId,
        status,
        score,
        timeSpentSeconds,
        incrementAttempt,
      } = req.body;

      const progress =
        await activityProgressService.updateProgress(
          userId,
          courseId,
          curriculumItemId,
          {
            status,
            score,
            timeSpentSeconds,
            incrementAttempt,
          }
        );

      return ApiResponse.success(
        res,
        progress,
        'Activity progress updated'
      );
    }
  ),

  complete: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        curriculumItemId,
        score,
        timeSpentSeconds,
        incrementAttempt,
      } = req.body;

      const progress =
        await activityProgressService.completeActivity(
          userId,
          courseId,
          curriculumItemId,
          {
            score,
            timeSpentSeconds,
            incrementAttempt,
          }
        );

      return ApiResponse.success(
        res,
        progress,
        'Activity marked complete'
      );
    }
  ),

  markStepComplete: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        curriculumItemId,
        stepIndex,
      } = req.body;

      const progress =
        await activityProgressService.markStepComplete(
          userId,
          courseId,
          curriculumItemId,
          stepIndex
        );

      return ApiResponse.success(
        res,
        progress,
        'Activity step marked complete'
      );
    }
  ),

  markChallengeComplete: asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const userId =
        req.user!._id.toString();

      const {
        courseId,
        curriculumItemId,
        challengeIndex,
      } = req.body;

      const progress =
        await activityProgressService.markChallengeComplete(
          userId,
          courseId,
          curriculumItemId,
          challengeIndex
        );

      return ApiResponse.success(
        res,
        progress,
        'Activity challenge marked complete'
      );
    }
  ),
};