import type { Response } from 'express';
import { z } from 'zod';
import { problemService } from '../services/problem.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * One test case shape. Every test case stores plaintext `expectedOutput`.
 * `isHidden` is a display flag - it hides the input/output from the
 * student's test panel but does not affect execution or grading.
 */
const testCaseSchema = z
  .object({
    input: z.string().default(''),
    expectedOutput: z.string().min(1, 'Expected output is required'),
    isHidden: z.boolean().default(false),
  })
  .strict();

export const problemBodySchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150),
    slug: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    topics: z.array(z.string()).default([]),
    statement: z.string().min(10),
    functionName: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
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