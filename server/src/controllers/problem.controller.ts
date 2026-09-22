import type { Response } from 'express';
import { z } from 'zod';
import { problemService } from '../services/problem.service.js';
import { judgeService } from '../services/judge.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const problemSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

/**
 * Submission payload.
 *
 * Two shapes are accepted:
 *
 *  1. Structured (preferred):
 *       { problemId, language, code, sessionId,
 *         visibleResults: [{ index, passed }],
 *         hiddenResults:  [{ id, passed }],
 *         runtimeMs? }
 *
 *  2. Legacy:
 *       { problemId, language, code,
 *         status, passedTests, totalTests, runtimeMs? }
 *
 * The server distinguishes them by presence of `visibleResults` /
 * `hiddenResults`. Both are `.strict()` — unknown keys are rejected so
 * a client cannot smuggle `expectedOutput` or `stdout` into the
 * payload.
 */
const structuredSubmitSchema = z
  .object({
    problemId: z.string().min(1),
    language: z.string().min(1),
    code: z.string().min(1),
    sessionId: z.string().uuid(),
    visibleResults: z
      .array(
        z
          .object({
            index: z.number().int().min(0),
            passed: z.boolean(),
          })
          .strict()
      )
      .max(500),
    hiddenResults: z
      .array(
        z
          .object({
            id: z.string().min(1),
            passed: z.boolean(),
          })
          .strict()
      )
      .max(500),
    runtimeMs: z.number().int().min(0).optional(),
  })
  .strict();

const legacySubmitSchema = z
  .object({
    problemId: z.string().min(1),
    language: z.string().min(1),
    code: z.string().min(1),
    status: z.enum([
      'accepted',
      'wrong_answer',
      'runtime_error',
      'compile_error',
    ]),
    passedTests: z.number().int().min(0),
    totalTests: z.number().int().min(0),
    runtimeMs: z.number().int().min(0).optional(),
  })
  .strict();

export const submitSchema = z.object({
  body: z.union([structuredSubmitSchema, legacySubmitSchema]),
});

export const validateResultsSchema = z.object({
  body: z.object({
    problemId: z.string().min(1),
    reportedResults: z
      .array(
        z.object({
          index: z.number().int().min(0),
          passed: z.boolean(),
        })
      )
      .min(1),
  }),
});

export const problemController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const problems = await problemService.list(userId);
    return ApiResponse.success(res, problems);
  }),

  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;
    const problem = await problemService.getBySlug(slug, userId);
    return ApiResponse.success(res, problem);
  }),

  validate: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await judgeService.validateResults(req.body);
    return ApiResponse.success(res, result);
  }),

  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const submission = await judgeService.recordSubmission({
      userId,
      ...req.body,
    });
    return ApiResponse.success(res, submission, 'Submission recorded', 201);
  }),

  submissions: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const problemId = Array.isArray(req.params.problemId)
      ? req.params.problemId[0]
      : req.params.problemId;
    const list = await judgeService.listForUser(userId, problemId);
    return ApiResponse.success(res, list);
  }),
};