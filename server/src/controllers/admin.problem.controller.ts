import type { Response } from 'express';
import { z } from 'zod';
import { problemService } from '../services/problem.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const testCaseSchema = z.object({
  input: z.string().default(''),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isHidden: z.boolean().default(false),
});

/**
 * Body-only schema for POST /admin/problems.
 * Wrapped in { body } so it matches the validator contract.
 */
export const problemBodySchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 chars').max(150),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 chars')
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    topics: z.array(z.string()).default([]),
    statement: z.string().min(10, 'Statement must be at least 10 chars'),
    starterCode: z.record(z.string()).default({}),
    testCases: z.array(testCaseSchema).default([]),
  }),
});

/**
 * Update schema for PATCH /admin/problems/:slug
 * Requires params + body.
 */
export const updateProblemSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    slug: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    topics: z.array(z.string()).optional(),
    statement: z.string().min(10).optional(),
    starterCode: z.record(z.string()).optional(),
    testCases: z.array(testCaseSchema).optional(),
  }),
});

export const problemSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const adminProblemController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    // validator already confirmed req.body is correct
    const created = await problemService.createProblem(req.body);
    return ApiResponse.success(res, created, 'Problem created', 201);
  }),

  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const problem = await problemService.getFullBySlug(slug);
    return ApiResponse.success(res, problem);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const updated = await problemService.updateProblem(slug, req.body);
    return ApiResponse.success(res, updated, 'Problem updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const result = await problemService.deleteProblem(slug);
    return ApiResponse.success(res, result, 'Problem deleted');
  }),
};