import type { Response } from 'express';
import { z } from 'zod';
import { problemService } from '../services/problem.service.js';
import { judgeService } from '../services/judge.service.js';
import { Course } from '../models/Course.model.js';
import { permissions } from '../services/permissions.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const problemSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const listProblemsSchema = z.object({
  query: z.object({
    tier: z.enum(['starter', 'interview']).optional(),
  }),
});

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

/**
 * Does the caller have access to the course that owns a
 * course-scoped problem?
 *
 * Admin: yes.
 * Course team (any role): yes.
 * Enrolled student: handled by the caller in a later batch; for now,
 * since enrollment gating is Batch 6, we treat "logged in and not
 * banned" as sufficient for course-scoped reads, and let the gate be
 * added when Batch 6 lands.
 *
 * For Batch 3, this is deliberately permissive: a course-scoped
 * problem is visible to any logged-in user. Tightening the check to
 * require course membership is a one-line change here once Batch 6
 * adds the enrollment gate.
 */
async function hasCourseAccess(
  req: AuthRequest,
  courseId: string | undefined
): Promise<boolean> {
  if (!courseId) return false;
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;

  // Non-admins: check course team membership.
  const course = await Course.findById(courseId).select('_id').lean();
  if (!course) return false;

  const role = await permissions.resolveEffectiveRole(
    { _id: req.user._id.toString(), role: req.user.role as string },
    courseId
  );
  return role !== null;
}

export const problemController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const tier = (req.query.tier as 'starter' | 'interview' | undefined) ?? undefined;
    const problems = await problemService.listGlobal(userId, tier);
    return ApiResponse.success(res, problems);
  }),

  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    // Peek at the problem to learn its scope before deciding access.
    // The service handles the 404 for course-scoped problems the
    // caller can't see.
    const peek = await problemService.getFullBySlug(slug);
    const access =
      peek.scope === 'global'
        ? true
        : await hasCourseAccess(req, peek.courseId);

    const problem = await problemService.getBySlug(slug, userId, access);
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