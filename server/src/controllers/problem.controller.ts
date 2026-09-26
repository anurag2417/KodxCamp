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
 * Can the caller see a course-scoped problem?
 *
 * Admins always can. Everyone else needs a non-null effective role
 * on the owning course — meaning they're on the course team, or
 * they're an enrolled student whose `resolveEffectiveRole` has been
 * extended to include `student`. Anonymous callers always get
 * `false`; course-scoped problems are never public.
 *
 * Global problems skip this check entirely — see the caller in
 * `getBySlug`.
 */
async function hasCourseAccess(
  req: AuthRequest,
  courseId: string | undefined
): Promise<boolean> {
  if (!courseId) return false;
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;

  const course = await Course.findById(courseId).select('_id').lean();
  if (!course) return false;

  const role = await permissions.resolveEffectiveRole(
    { _id: req.user._id.toString(), role: req.user.role as string },
    courseId
  );
  return role !== null;
}

export const problemController = {
  /**
   * GET /problems
   *
   * Public. Anonymous callers get the same list as signed-in ones,
   * minus the per-user `solved` flag, which is `undefined` when no
   * user is attached by `optionalAuth`.
   */
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const tier =
      (req.query.tier as 'starter' | 'interview' | undefined) ?? undefined;
    const problems = await problemService.listGlobal(userId, tier);
    return ApiResponse.success(res, problems);
  }),

  /**
   * GET /problems/:slug
   *
   * Public for global problems. Course-scoped problems are only
   * visible to users who can access the owning course.
   *
   * The order of operations here matters: we peek at the problem to
   * learn its scope, decide access, and only then ask the service
   * for the full payload. A signed-out caller hitting a
   * course-scoped problem gets a 404, not a 403 — that's the right
   * status for a resource the caller isn't even allowed to know
   * exists.
   */
  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

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