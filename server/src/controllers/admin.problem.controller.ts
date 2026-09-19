import type { Response } from 'express';
import { z } from 'zod';
import { problemService } from '../services/problem.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const testCaseSchema = z.object({
  input: z.string().default(''),
  expectedOutput: z.string().min(1, 'Expected output is required'),
});

/**
 * Body schema for POST /admin/problems.
 * Wrapped in { body } to match the validator contract.
 */
export const problemBodySchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 chars').max(150),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 chars')
      .max(80)
      .regex(
        /^[a-z0-9-]+$/,
        'Slug can only contain lowercase letters, numbers, and dashes'
      ),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    topics: z.array(z.string()).default([]),
    statement: z.string().min(10, 'Statement must be at least 10 chars'),
    functionName: z
      .string()
      .min(1, 'Function name is required')
      .max(60)
      .regex(
        /^[A-Za-z_][A-Za-z0-9_]*$/,
        'Function name must be a valid identifier (letters, digits, underscores; cannot start with a digit)'
      ),
    outputMode: z.enum(['return', 'print']).default('return'),
    starterCode: z.record(z.string()).default({}),
    testCases: z
      .array(testCaseSchema)
      .min(1, 'At least one test case is required'),
  }),
});

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
    functionName: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
      .optional(),
    outputMode: z.enum(['return', 'print']).optional(),
    starterCode: z.record(z.string()).optional(),
    testCases: z.array(testCaseSchema).optional(),
  }),
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
    const problem = await problemService.getFullBySlug(req.params.slug as string);
    return ApiResponse.success(res, problem);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await problemService.updateProblem(
      req.params.slug as string,
      req.body
    );
    return ApiResponse.success(res, updated, 'Problem updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await problemService.deleteProblem(req.params.slug as string);
    return ApiResponse.success(res, result, 'Problem deleted');
  }),
};