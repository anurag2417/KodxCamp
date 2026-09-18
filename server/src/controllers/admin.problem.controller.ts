import type { Response } from 'express';
import { z } from 'zod';
import { problemService } from '../services/problem.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const testCaseSchema = z.object({
  input: z.string().default(''),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(false),
});

export const problemBodySchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(80),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topics: z.array(z.string()).default([]),
  statement: z.string().min(10),
  starterCode: z.record(z.string()).default({}),
  testCases: z.array(testCaseSchema).default([]),
});

export const updateProblemSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: problemBodySchema.partial(),
});

export const problemSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const adminProblemController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const created = await problemService.createProblem(req.body);
    return ApiResponse.success(res, created, 'Problem created', 201);
  }),

  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const problem = await problemService.getFullBySlug(req.params.slug);
    return ApiResponse.success(res, problem);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await problemService.updateProblem(req.params.slug, req.body);
    return ApiResponse.success(res, updated, 'Problem updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await problemService.deleteProblem(req.params.slug);
    return ApiResponse.success(res, result, 'Problem deleted');
  }),
};