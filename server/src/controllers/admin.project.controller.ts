import type { Response } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const fileSchema = z.object({
  name: z.string().min(1),
  language: z.enum(['html', 'css', 'javascript', 'jsx', 'sql', 'json', 'markdown']),
  content: z.string().default(''),
  isEntry: z.boolean().optional(),
});

const rubricCategorySchema = z
  .object({
    category: z.string().min(1).max(60),
    weight: z.number().int().min(0).max(100),
  })
  .strict();

const specificationSchema = z
  .object({
    objective: z.string().max(2000).optional(),
    requiredFeatures: z.array(z.string()).optional(),
    technicalRequirements: z.array(z.string()).optional(),
    designRequirements: z.array(z.string()).optional(),
    accessibilityRequirements: z.array(z.string()).optional(),
    expectedBehaviour: z.string().max(4000).optional(),
  })
  .strict();

/* ─── Test grammar ─────────────────────────────────────────────── */

const domAssertionSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('dom-exists'),
      selector: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('dom-text'),
      selector: z.string().min(1),
      mode: z.enum(['equals', 'matches']),
      value: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('dom-attribute'),
      selector: z.string().min(1),
      attribute: z.string().min(1),
      value: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('dom-count'),
      selector: z.string().min(1),
      count: z.number().int().min(0),
    })
    .strict(),
]);

const projectTestCheckSchema = z.discriminatedUnion('type', [
  domAssertionSchema.options[0],
  domAssertionSchema.options[1],
  domAssertionSchema.options[2],
  domAssertionSchema.options[3],
  z
    .object({
      type: z.literal('event-click'),
      selector: z.string().min(1),
      assert: domAssertionSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('event-input'),
      selector: z.string().min(1),
      value: z.string(),
      assert: domAssertionSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('visual-nonblank'),
      minimumChars: z.number().int().min(1),
    })
    .strict(),
]);

const projectTestSchema = z
  .object({
    name: z.string().min(1).max(200),
    check: projectTestCheckSchema,
    description: z.string().max(500).optional(),
  })
  .strict();

/**
 * Validate the rubric weights sum to 100 when the rubric is
 * non-empty. An empty rubric is valid — it means "no rubric defined",
 * and the AI evaluator defaults to a single overall score.
 */
function validateRubric(
  rubric: { category: string; weight: number }[] | undefined
): void {
  if (!rubric || rubric.length === 0) return;
  const total = rubric.reduce((sum, r) => sum + r.weight, 0);
  if (total !== 100) {
    throw new ApiError(
      400,
      `Rubric weights must sum to 100 (got ${total}).`
    );
  }
}

export const projectBodySchema = z
  .object({
    title: z.string().min(2).max(150),
    slug: z.string().min(2).max(80),
    description: z.string().min(5).max(500),
    longDescription: z.string().default(''),
    category: z.enum(['frontend', 'react', 'api', 'sql', 'dataviz', 'javascript']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    topics: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    files: z.array(fileSchema).min(1),
    previewMode: z.enum(['html', 'react', 'sql', 'none']).default('html'),
    instructions: z.string().default(''),
    estimatedMinutes: z.number().int().min(5).max(600).default(60),
    xpReward: z.number().int().min(0).max(1000).default(100),

    mode: z.enum(['required', 'recommended', 'open_choice']).default('required'),
    specification: specificationSchema.default({}),
    rubric: z.array(rubricCategorySchema).default([]),
    tests: z.array(projectTestSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.rubric.length === 0) return;
    const total = data.rubric.reduce((sum, r) => sum + r.weight, 0);
    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Rubric weights must sum to 100 (got ${total}).`,
        path: ['rubric'],
      });
    }
  });

export const adminProjectController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const exists = await Project.findOne({ slug: req.body.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');
    validateRubric(req.body.rubric);
    const created = await Project.create(req.body);
    return ApiResponse.success(res, created.toObject(), 'Project created', 201);
  }),

  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await Project.findOne({ slug: req.params.slug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');
    return ApiResponse.success(res, project);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    if ('rubric' in req.body) {
      validateRubric(req.body.rubric);
    }
    const updated = await Project.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new ApiError(404, 'Project not found');
    return ApiResponse.success(res, updated, 'Project updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await Project.deleteOne({ slug: req.params.slug });
    if (result.deletedCount === 0) throw new ApiError(404, 'Project not found');
    return ApiResponse.success(res, { ok: true }, 'Project deleted');
  }),
};