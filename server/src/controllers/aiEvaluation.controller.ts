import type { Response } from 'express';
import { z } from 'zod';
import { aiEvaluationService } from '../services/aiEvaluation.service.js';
import { aiProviderRegistry } from '../services/aiProvider/registry.js';
import { projectService } from '../services/project.service.js';
import { AIEvaluation } from '../models/AIEvaluation.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { Project } from '../models/Project.model.js';
import { User } from '../models/User.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Admin controller for AI project evaluation.
 *
 * Endpoints:
 *
 *   GET  /admin/ai/status
 *     Which providers are configured. Lets the admin UI disable the
 *     "Evaluate" button when there is nothing to run against.
 *
 *   GET  /admin/projects/:slug/submissions
 *     Every submission for a project, with a summary of the latest
 *     code/vision evaluation for each.
 *
 *   GET  /admin/projects/submissions/:submissionId
 *     Read any submission by id, owner-agnostic. Admin-only.
 *
 *   GET  /admin/projects/submissions/:submissionId/evaluations
 *     Every evaluation ever recorded for a submission, newest first.
 *
 *   POST /admin/projects/submissions/:submissionId/evaluate
 *     Run the AI pipeline. Admin-triggered, never automatic.
 *
 * Idempotency: `AIEvaluation` has a unique index on
 * `(submissionId, kind, evaluatorVersion, promptVersion)`. A second
 * `evaluate` call with the same versions produces a duplicate-key
 * error, which the client surfaces. Bumping `evaluatorVersion` or
 * `promptVersion` in `aiEvaluation.service.ts` produces a new row
 * alongside the old one — old evaluations are never mutated.
 */

/* ─── Schemas ────────────────────────────────────────────────────── */

export const submissionIdParamsSchema = z.object({
  params: z.object({ submissionId: z.string().min(1) }),
});

export const projectSlugParamSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const listEvaluationsQuerySchema = z.object({
  params: z.object({ submissionId: z.string().min(1) }),
  query: z.object({
    kind: z.enum(['code', 'vision']).optional(),
  }),
});

/* ─── Controllers ────────────────────────────────────────────────── */

export const aiEvaluationController = {
  /**
   * Report which providers are configured. Called by the admin UI on
   * page load so it can disable the "Evaluate" button when there is
   * nothing to run against, without triggering a real call.
   */
  status: asyncHandler(async (_req: AuthRequest, res: Response) => {
    return ApiResponse.success(res, {
      textConfigured: aiProviderRegistry.isTextConfigured(),
      visionConfigured: aiProviderRegistry.isVisionConfigured(),
    });
  }),

  /**
   * Run evaluation for a submission. Admin-triggered, never
   * automatic. Runs the code pass always, the vision pass when a
   * vision provider is configured and the submission has
   * screenshots.
   */
  evaluate: asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user!._id.toString();
    const submissionId = String(req.params.submissionId);

    const result = await aiEvaluationService.evaluateSubmission({
      submissionId,
      evaluatedBy: adminId,
    });

    return ApiResponse.success(res, result, 'AI evaluation complete', 201);
  }),

  /**
   * Read any submission by id, owner-agnostic. Admin-only.
   *
   * The public `projectController.submission` is owner-scoped. This
   * handler delegates to `projectService.getSubmissionForAdmin`,
   * which is deliberately not owner-scoped because the entire admin
   * router sits behind `requireAdmin`.
   */
  getSubmission: asyncHandler(async (req: AuthRequest, res: Response) => {
    const submissionId = String(req.params.submissionId);
    const submission = await projectService.getSubmissionForAdmin(
      submissionId,
    );
    return ApiResponse.success(res, submission);
  }),

  /**
   * List every evaluation ever recorded for a submission. Newest
   * first. Optionally filtered to one `kind`.
   *
   * Rows produced under previous prompt versions are preserved and
   * shown alongside the newest — the admin can see the full history.
   */
  listForSubmission: asyncHandler(async (req: AuthRequest, res: Response) => {
    const submissionId = String(req.params.submissionId);
    const kindFilter = req.query.kind as 'code' | 'vision' | undefined;

    const query: Record<string, unknown> = { submissionId };
    if (kindFilter) query.kind = kindFilter;

    const rows = await AIEvaluation.find(query)
      .sort({ evaluationDate: -1 })
      .lean();

    return ApiResponse.success(res, rows);
  }),

  /**
   * List submissions for a project, joined with the newest evaluation
   * of each kind. Used by the admin list view.
   */
  listProjectSubmissions: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const projectSlug = String(req.params.slug);

      const project = await Project.findOne({ slug: projectSlug })
        .select('_id')
        .lean();
      if (!project) throw new ApiError(404, 'Project not found');

      const submissions = await ProjectSubmission.find({
        projectId: project._id.toString(),
      })
        .sort({ submittedAt: -1 })
        .lean();

      if (submissions.length === 0) {
        return ApiResponse.success(res, []);
      }

      const submissionIds = submissions.map((s) => String(s._id));
      const userIds = Array.from(new Set(submissions.map((s) => s.userId)));

      const [users, evaluations] = await Promise.all([
        User.find({ _id: { $in: userIds } })
          .select('_id name email avatar')
          .lean(),
        AIEvaluation.find({ submissionId: { $in: submissionIds } })
          .sort({ evaluationDate: -1 })
          .lean(),
      ]);

      const userById = new Map(users.map((u) => [String(u._id), u]));

      const latestBySubmissionAndKind = new Map<
        string,
        {
          code?: { score: number | null; evaluationDate: Date };
          vision?: { score: number | null; evaluationDate: Date };
        }
      >();

      for (const ev of evaluations) {
        const key = ev.submissionId;
        const existing = latestBySubmissionAndKind.get(key) ?? {};
        const slot = ev.kind as 'code' | 'vision';
        if (!existing[slot]) {
          const parsed = ev.parsed as { score?: number | null } | undefined;
          existing[slot] = {
            score: parsed?.score ?? null,
            evaluationDate: ev.evaluationDate,
          };
        }
        latestBySubmissionAndKind.set(key, existing);
      }

      return ApiResponse.success(
        res,
        submissions.map((s) => {
          const u = userById.get(s.userId);
          const evals = latestBySubmissionAndKind.get(String(s._id)) ?? {};
          return {
            _id: String(s._id),
            attemptNumber: s.attemptNumber,
            status: s.status,
            submittedAt: s.submittedAt,
            testRunSummary: s.testRun
              ? {
                  totalTests: s.testRun.totalTests,
                  passedTests: s.testRun.passedTests,
                  allPassed: s.testRun.allPassed,
                }
              : null,
            hasScreenshots: Boolean(
              s.screenshots?.desktop || s.screenshots?.mobile,
            ),
            student: {
              _id: s.userId,
              name: u?.name ?? '(unknown)',
              email: u?.email ?? '',
              avatar: u?.avatar,
            },
            latestEvaluations: {
              code: evals.code ?? null,
              vision: evals.vision ?? null,
            },
          };
        }),
      );
    },
  ),
};