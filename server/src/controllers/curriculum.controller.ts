import type { Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { curriculumService } from '../services/curriculum.service.js';

const courseSlugParam = z.object({
  courseSlug: z.string().min(1),
});

export const curriculumCourseSchema = z.object({
  params: courseSlugParam,
});

export const sectionParamsSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    sectionId: z.string().min(1),
  }),
});

export const itemParamsSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    itemId: z.string().min(1),
  }),
});

export const createSectionSchema = z.object({
  params: courseSlugParam,

  body: z
    .object({
      moduleId: z.string().min(1),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      order: z.number().int().min(1).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
});

export const updateSectionSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    sectionId: z.string().min(1),
  }),

  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
});

export const reorderSectionSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    sectionId: z.string().min(1),
  }),

  body: z
    .object({
      order: z.number().int().min(1),
    })
    .strict(),
});

const curriculumItemTypeSchema = z.enum([
  'lesson',
  'mcq',
  'coding_problem',
  'sql_problem',
  'web_theory',
  'web_step',
  'web_workshop',
  'web_lab',
  'quiz',
  'project',
  'live_class',
]);

export const createCurriculumItemSchema = z.object({
  params: courseSlugParam,

  body: z
    .object({
      sectionId: z.string().min(1),

      type: curriculumItemTypeSchema,

      referenceId: z.string().min(1),

      title: z.string().min(1).max(200).optional(),

      description: z.string().max(1000).optional(),

      order: z.number().int().min(1).optional(),

      isRequired: z.boolean().optional(),

      published: z.boolean().optional(),

      estimatedMinutes: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
    })
    .strict(),
});

export const updateCurriculumItemSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    itemId: z.string().min(1),
  }),

  body: z
    .object({
      title: z.string().min(1).max(200).optional(),

      description: z.string().max(1000).optional(),

      isRequired: z.boolean().optional(),

      published: z.boolean().optional(),

      estimatedMinutes: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
    })
    .strict(),
});

export const reorderCurriculumItemSchema =
  z.object({
    params: z.object({
      courseSlug: z.string().min(1),
      itemId: z.string().min(1),
    }),

    body: z
      .object({
        order: z.number().int().min(1),
      })
      .strict(),
  });

export const curriculumController = {
  getStudentCurriculum: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.getStudentCurriculum(
          req,
          String(req.params.courseSlug)
        );

      return ApiResponse.success(
        res,
        result
      );
    }
  ),

  getInstructorCurriculum: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.getInstructorCurriculum(
          req,
          String(req.params.courseSlug)
        );

      return ApiResponse.success(
        res,
        result
      );
    }
  ),

  createSection: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.createSection(
          req,
          String(req.params.courseSlug),
          req.body
        );

      return ApiResponse.success(
        res,
        result,
        'Section created',
        201
      );
    }
  ),

  updateSection: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.updateSection(
          req,
          String(req.params.courseSlug),
          String(req.params.sectionId),
          req.body
        );

      return ApiResponse.success(
        res,
        result,
        'Section updated'
      );
    }
  ),

  deleteSection: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.deleteSection(
          req,
          String(req.params.courseSlug),
          String(req.params.sectionId)
        );

      return ApiResponse.success(
        res,
        result,
        'Section deleted'
      );
    }
  ),

  reorderSection: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.reorderSection(
          req,
          String(req.params.courseSlug),
          String(req.params.sectionId),
          req.body.order
        );

      return ApiResponse.success(
        res,
        result,
        'Section reordered'
      );
    }
  ),

  createItem: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.createItem(
          req,
          String(req.params.courseSlug),
          req.body
        );

      return ApiResponse.success(
        res,
        result,
        'Curriculum item created',
        201
      );
    }
  ),

  updateItem: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.updateItem(
          req,
          String(req.params.courseSlug),
          String(req.params.itemId),
          req.body
        );

      return ApiResponse.success(
        res,
        result,
        'Curriculum item updated'
      );
    }
  ),

  deleteItem: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.deleteItem(
          req,
          String(req.params.courseSlug),
          String(req.params.itemId)
        );

      return ApiResponse.success(
        res,
        result,
        'Curriculum item deleted'
      );
    }
  ),

  reorderItem: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result =
        await curriculumService.reorderItem(
          req,
          String(req.params.courseSlug),
          String(req.params.itemId),
          req.body.order
        );

      return ApiResponse.success(
        res,
        result,
        'Curriculum item reordered'
      );
    }
  ),
};