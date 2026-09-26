import { InstructorEvaluation } from '../models/InstructorEvaluation.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { User } from '../models/User.model.js';
import { Project } from '../models/Project.model.js';
import { ApiError } from '../utils/ApiError.js';
import { projectReviewAccessService } from './projectReviewAccess.service.js';
import { activityService } from './activity.service.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

type InstructorEvaluationStatus =
  | 'passed'
  | 'needs_improvement'
  | 'resubmission_requested';

interface CreateReviewInput {
  instructorId: string;
  instructorRole: 'student' | 'instructor' | 'admin';
  submissionId: string;
  finalScore: number;
  categoryOverrides: { category: string; score: number; note?: string }[];
  feedback: string;
  requestResubmission: boolean;
  status: InstructorEvaluationStatus;
}

export const instructorEvaluationService = {
  async createReview(input: CreateReviewInput) {
    const submission = await ProjectSubmission.findById(
      input.submissionId,
    ).lean();
    if (!submission) throw new ApiError(404, 'Submission not found');

    await projectReviewAccessService.requireReview({
      userId: input.instructorId,
      userRole: input.instructorRole,
      projectId: submission.projectId,
      submitterId: submission.userId,
    });

    const last = await InstructorEvaluation.findOne({
      submissionId: input.submissionId,
      instructorId: input.instructorId,
    })
      .sort({ revisionNumber: -1 })
      .select('revisionNumber')
      .lean();

    const nextRevision = (last?.revisionNumber ?? 0) + 1;

    let evaluation;
    let retry = 0;
    const maxRetries = 3;
    while (retry < maxRetries) {
      try {
        evaluation = await InstructorEvaluation.create({
          submissionId: input.submissionId,
          projectId: submission.projectId,
          instructorId: input.instructorId,
          revisionNumber: nextRevision + retry,
          finalScore: input.finalScore,
          categoryOverrides: input.categoryOverrides,
          feedback: input.feedback,
          requestResubmission: input.requestResubmission,
          status: input.status,
          evaluationDate: new Date(),
        });
        break;
      } catch (err) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: number }).code === 11000
        ) {
          retry++;
          continue;
        }
        throw err;
      }
    }

    if (!evaluation) {
      throw new ApiError(500, 'Could not allocate a review revision');
    }

    await ProjectSubmission.updateOne(
      { _id: submission._id },
      { $set: { status: input.status } },
    );

    if (input.requestResubmission) {
      await UserProject.updateOne(
        { userId: submission.userId, projectId: submission.projectId },
        { $set: { status: 'in_progress' } },
      );
    }

    // Notify the student. Fire-and-forget — the review is saved
    // regardless of whether the notification lands.
    void notifyStudentOfReview({
      submission,
      instructorId: input.instructorId,
      status: input.status,
      requestResubmission: input.requestResubmission,
      feedback: input.feedback,
      finalScore: input.finalScore,
    });

    try {
      await activityService.record({
        userId: submission.userId,
        type: 'project_reviewed',
        refId: submission.projectId,
        xp: 0,
      });
    } catch (err) {
      logger.warn('Failed to record instructor review activity', {
        submissionId: input.submissionId,
        err: err instanceof Error ? err.message : String(err),
      });
    }

    return evaluation.toObject();
  },

  async listForSubmission(submissionId: string) {
    const reviews = await InstructorEvaluation.find({ submissionId })
      .sort({ evaluationDate: -1 })
      .lean();

    if (reviews.length === 0) return [];

    const instructorIds = Array.from(
      new Set(reviews.map((r) => r.instructorId)),
    );
    const instructors = await User.find({ _id: { $in: instructorIds } })
      .select('_id name email avatar role')
      .lean();
    const byId = new Map(instructors.map((u) => [String(u._id), u]));

    return reviews.map((r) => {
      const u = byId.get(r.instructorId);
      return {
        ...r,
        _id: String(r._id),
        instructor: {
          _id: r.instructorId,
          name: u?.name ?? '(unknown)',
          email: u?.email ?? '',
          avatar: u?.avatar,
          role: u?.role ?? 'instructor',
        },
      };
    });
  },

  async latestForSubmission(submissionId: string) {
    const latest = await InstructorEvaluation.findOne({ submissionId })
      .sort({ evaluationDate: -1 })
      .lean();

    if (!latest) return null;

    const instructor = await User.findById(latest.instructorId)
      .select('_id name email avatar role')
      .lean();

    return {
      ...latest,
      _id: String(latest._id),
      instructor: {
        _id: latest.instructorId,
        name: instructor?.name ?? '(unknown)',
        email: instructor?.email ?? '',
        avatar: instructor?.avatar,
        role: instructor?.role ?? 'instructor',
      },
    };
  },

  async listByInstructor(instructorId: string, limit = 50) {
    const reviews = await InstructorEvaluation.find({ instructorId })
      .sort({ evaluationDate: -1 })
      .limit(limit)
      .lean();

    if (reviews.length === 0) return [];

    const submissionIds = reviews.map((r) => r.submissionId);
    const submissions = await ProjectSubmission.find({
      _id: { $in: submissionIds },
    })
      .select('_id attemptNumber projectId userId')
      .lean();
    const byId = new Map(submissions.map((s) => [String(s._id), s]));

    const userIds = Array.from(
      new Set(submissions.map((s) => s.userId)),
    );
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email avatar')
      .lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    return reviews.map((r) => {
      const s = byId.get(r.submissionId);
      const u = s ? userById.get(s.userId) : undefined;
      return {
        ...r,
        _id: String(r._id),
        submission: s
          ? {
              _id: String(s._id),
              attemptNumber: s.attemptNumber,
              projectId: s.projectId,
              student: {
                _id: s.userId,
                name: u?.name ?? '(unknown)',
                email: u?.email ?? '',
                avatar: u?.avatar,
              },
            }
          : null,
      };
    });
  },
};

/**
 * Send a notification to the student whose submission was just
 * reviewed.
 *
 * The type depends on what the instructor asked for:
 *   - `resubmission_requested` → `resubmission_requested`
 *   - anything else           → `project_feedback`
 *
 * Both go through the same preference category (`projectFeedback`),
 * so a student who mutes project feedback mutes both.
 */
async function notifyStudentOfReview(input: {
  submission: { _id: unknown; userId: string; projectId: string; attemptNumber: number };
  instructorId: string;
  status: InstructorEvaluationStatus;
  requestResubmission: boolean;
  feedback: string;
  finalScore: number;
}): Promise<void> {
  try {
    const project = await Project.findById(input.submission.projectId)
      .select('title slug')
      .lean();

    const isResubmit = input.requestResubmission;

    await notificationService.create({
      userId: input.submission.userId,
      type: isResubmit ? 'resubmission_requested' : 'project_feedback',
      title: isResubmit
        ? 'Your instructor requested a new submission'
        : `Your instructor reviewed "${project?.title ?? 'your project'}"`,
      body: isResubmit
        ? input.feedback
        : `Final score: ${input.finalScore}/100.\n\n${input.feedback}`,
      link: project ? `/projects/${project.slug}` : undefined,
      metadata: {
        submissionId: String(input.submission._id),
        projectId: input.submission.projectId,
        attemptNumber: input.submission.attemptNumber,
      },
    });
  } catch (err) {
    logger.warn('Failed to notify student of review', {
      submissionId: String(input.submission._id),
      err: err instanceof Error ? err.message : String(err),
    });
  }
}