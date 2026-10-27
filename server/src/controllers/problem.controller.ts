import type { Response } from 'express';
import { z } from 'zod';
import { problemService } from '../services/problem.service.js';
import { judgeService } from '../services/judge.service.js';
import { Problem } from '../models/Problem.model.js';
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

/**
 * The submission contract.
 *
 * The server does NOT execute code. The client runs every test case
 * (visible and hidden alike) and reports the outcome — status, pass
 * count, total count, and optional runtime. The server clamps the
 * counts against the problem's real test-case count and records the
 * result.
 *
 * An earlier version of this file also accepted a "structured" shape
 * with `visibleResults` / `hiddenResults` / `sessionId`. That shape
 * was never sent by the client, was never tested end-to-end, and
 * silently produced `NaN` values in the submissions collection if a
 * caller (curl, a future client, a bad test) sent it. It's been
 * removed. If you ever want a structured contract, add it alongside
 * a matching client change, not before.
 */
export const submitSchema = z.object({
  body: z
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
    .strict(),
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
 * on the owning course. Anonymous callers always get `false`;
 * course-scoped problems are never public.
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
   * minus the per-user `solved` flag.
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
   * The order of operations matters: peek at only the scope and
   * courseId (a lightweight projection), decide access, then fetch
   * the full payload. A signed-out caller hitting a course-scoped
   * problem gets a 404 — the right status for a resource they aren't
   * allowed to know exists.
   */
  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    // Lightweight peek — only the scope-relevant fields. Earlier
    // versions fetched the full problem here (including solution and
    // test cases), which was a wasted round-trip on every request.
    const peek = await Problem.findOne({ slug })
      .select('scope courseId')
      .lean();
    if (!peek) {
      // Delegate to the service so the error shape is consistent.
      return problemService.getBySlug(slug, userId, false);
    }

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