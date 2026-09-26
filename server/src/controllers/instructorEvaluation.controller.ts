import type { Response } from 'express';
import { z } from 'zod';
import { instructorEvaluationService } from '../services/instructorEvaluation.service.js';
import { projectService } from '../services/project.service.js';
import { InstructorEvaluation } from '../models/InstructorEvaluation.model.js';
import { AIEvaluation } from '../models/AIEvaluation.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { Project } from '../models/Project.model.js';
import { User } from '../models/User.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/* ─── Schemas ────────────────────────────────────────────────────── */

const categoryOverrideSchema = z
  .object({
    category: z.string().min(1).max(120),
    score: z.number().min(0).max(100),
    note: z.string().max(2000).optional(),
  })
  .strict();

export const createReviewSchema = z.object({
  params: z.object({ submissionId: z.string().min(1) }),
  body: z
    .object({
      finalScore: z.number().min(0).max(100),
      categoryOverrides: z.array(categoryOverrideSchema).default([]),
      feedback: z.string().min(1).max(10_000),
      requestResubmission: z.boolean(),
      status: z.enum([
        'passed',
        'needs_improvement',
        'resubmission_requested',
      ]),
    })
    .strict(),
});

export const submissionParamsSchema = z.object({
  params: z.object({ submissionId: z.string().min(1) }),
});

export const projectSubmissionsParamsSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({
    filter: z.enum(['needs_review', 'reviewed', 'all']).default('all'),
  }),
});

/* ─── Controllers ────────────────────────────────────────────────── */

export const instructorEvaluationController = {
  /**
   * POST /instructor/submissions/:submissionId/reviews
   */
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const instructorId = req.user!._id.toString();
    const instructorRole = req.user!.role as 'student' | 'instructor' | 'admin';
    const submissionId = String(req.params.submissionId);

    const created = await instructorEvaluationService.createReview({
      instructorId,
      instructorRole,
      submissionId,
      finalScore: req.body.finalScore,
      categoryOverrides: req.body.categoryOverrides,
      feedback: req.body.feedback,
      requestResubmission: req.body.requestResubmission,
      status: req.body.status,
    });

    return ApiResponse.success(res, created, 'Review saved', 201);
  }),

  /**
   * GET /instructor/submissions/:submissionId/reviews
   */
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const submissionId = String(req.params.submissionId);
    const reviews = await instructorEvaluationService.listForSubmission(
      submissionId,
    );
    return ApiResponse.success(res, reviews);
  }),

  /**
   * GET /instructor/submissions/:submissionId
   */
  getSubmission: asyncHandler(async (req: AuthRequest, res: Response) => {
    const submissionId = String(req.params.submissionId);
    const submission = await projectService.getSubmissionForAdmin(
      submissionId,
    );
    return ApiResponse.success(res, submission);
  }),

  /**
   * GET /instructor/submissions/:submissionId/evaluations
   *
   * CHANGED: new handler. Mirrors `aiEvaluationController.listForSubmission`
   * but lives under the instructor router so non-admin instructors can
   * read AI evaluations for a submission they're reviewing. Before this
   * endpoint existed, `InstructorSubmissionReview.tsx` called the admin
   * route and got a 403 for instructors without the admin role.
   *
   * Optional `kind` query filters to one pass (`code` or `vision`).
   */
  listEvaluations: asyncHandler(async (req: AuthRequest, res: Response) => {
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
   * GET /instructor/projects/:slug/submissions
   */
  listProjectSubmissions: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const projectSlug = String(req.params.slug);
      const filter = req.query.filter as 'needs_review' | 'reviewed' | 'all';

      const submissions = await projectService.listSubmissionsForAdmin(
        projectSlug,
      );

      const submissionIds = submissions.map((s) => String(s._id));
      const reviews = await InstructorEvaluation.find({
        submissionId: { $in: submissionIds },
      })
        .sort({ evaluationDate: -1 })
        .lean();

      const latestBySubmission = new Map<string, (typeof reviews)[number]>();
      for (const r of reviews) {
        if (!latestBySubmission.has(r.submissionId)) {
          latestBySubmission.set(r.submissionId, r);
        }
      }

      const filtered = submissions.filter((s) => {
        if (filter === 'all') return true;
        const latest = latestBySubmission.get(String(s._id));
        if (filter === 'needs_review') return !latest;
        return Boolean(latest);
      });

      return ApiResponse.success(
        res,
        filtered.map((s) => {
          const latest = latestBySubmission.get(String(s._id));
          return {
            ...s,
            latestReview: latest
              ? {
                  _id: String(latest._id),
                  instructorId: latest.instructorId,
                  revisionNumber: latest.revisionNumber,
                  finalScore: latest.finalScore,
                  status: latest.status,
                  requestResubmission: latest.requestResubmission,
                  evaluationDate: latest.evaluationDate,
                }
              : null,
          };
        }),
      );
    },
  ),

  /**
   * GET /instructor/reviews/pending
   *
   * Submissions that need review — the instructor's to-do list.
   */
  listPendingReviews: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const projects = await Project.find()
      .select('_id title slug')
      .lean();

    if (projects.length === 0) {
      return ApiResponse.success(res, []);
    }

    const projectIds = projects.map((p) => String(p._id));

    const submissions = await ProjectSubmission.find({
      projectId: { $in: projectIds },
    })
      .sort({ submittedAt: 1 })
      .lean();

    if (submissions.length === 0) {
      return ApiResponse.success(res, []);
    }

    const submissionIds = submissions.map((s) => String(s._id));
    const reviewedIds = new Set(
      (
        await InstructorEvaluation.find({
          submissionId: { $in: submissionIds },
        })
          .select('submissionId')
          .lean()
      ).map((r) => r.submissionId),
    );

    const pending = submissions
      .filter((s) => !reviewedIds.has(String(s._id)))
      .slice(0, 100);

    if (pending.length === 0) {
      return ApiResponse.success(res, []);
    }

    const studentIds = Array.from(new Set(pending.map((s) => s.userId)));
    const [students, projectById] = await Promise.all([
      User.find({ _id: { $in: studentIds } })
        .select('_id name email avatar')
        .lean(),
      Promise.resolve(new Map(projects.map((p) => [String(p._id), p]))),
    ]);
    const studentById = new Map(
      students.map((u) => [String(u._id), u]),
    );

    return ApiResponse.success(
      res,
      pending.map((s) => {
        const student = studentById.get(s.userId);
        const project = projectById.get(s.projectId);
        return {
          _id: String(s._id),
          userId: s.userId,
          projectId: s.projectId,
          attemptNumber: s.attemptNumber,
          status: s.status,
          submittedAt: s.submittedAt,
          testRun: s.testRun,
          screenshots: s.screenshots,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          student: {
            _id: s.userId,
            name: student?.name ?? '(unknown)',
            email: student?.email ?? '',
            avatar: student?.avatar,
          },
          project: project
            ? {
                _id: String(project._id),
                title: project.title,
                slug: project.slug,
              }
            : null,
          latestReview: null,
        };
      }),
    );
  }),
};