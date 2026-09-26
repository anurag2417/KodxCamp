import { Project } from '../models/Project.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { User } from '../models/User.model.js';
import { InstructorEvaluation } from '../models/InstructorEvaluation.model.js';
import { ApiError } from '../utils/ApiError.js';
import { activityService } from './activity.service.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

interface SubmitProjectInput {
  userId: string;
  projectSlug: string;
  files?: { name: string; language: string; content: string; isEntry?: boolean }[];
  notes?: string;
  testRun?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    allPassed: boolean;
    durationMs: number;
    results: {
      name: string;
      check: Record<string, unknown>;
      passed: boolean;
      actual: string;
      message?: string;
    }[];
    ranAt: string | Date;
    error?: string;
  };
  screenshots?: {
    desktop?: {
      viewport: 'desktop';
      width: number;
      height: number;
      dataUrl: string;
    };
    mobile?: {
      viewport: 'mobile';
      width: number;
      height: number;
      dataUrl: string;
    };
    error?: string;
  };
}

/**
 * Attach the latest instructor review to each submission in a list.
 * Batched — one query for reviews, not one per submission.
 */
async function attachInstructorFeedback<
  T extends { _id: unknown; userId: string },
>(submissions: T[]) {
  if (submissions.length === 0) {
    return submissions.map((s) => ({ ...s, instructorFeedback: undefined }));
  }

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

  const instructorIds = Array.from(
    new Set(reviews.map((r) => r.instructorId)),
  );
  const instructors = await User.find({ _id: { $in: instructorIds } })
    .select('_id name')
    .lean();
  const nameById = new Map(
    instructors.map((u) => [String(u._id), u.name]),
  );

  return submissions.map((s) => {
    const latest = latestBySubmission.get(String(s._id));
    if (!latest) return { ...s, instructorFeedback: undefined };
    return {
      ...s,
      instructorFeedback: {
        _id: String(latest._id),
        instructorId: latest.instructorId,
        instructorName: nameById.get(latest.instructorId) ?? '(unknown)',
        revisionNumber: latest.revisionNumber,
        finalScore: latest.finalScore,
        categoryOverrides: latest.categoryOverrides,
        feedback: latest.feedback,
        requestResubmission: latest.requestResubmission,
        status: latest.status,
        evaluationDate: latest.evaluationDate,
      },
    };
  });
}

export const projectService = {
  async listAll(userId?: string) {
    const projects = await Project.find()
      .select('-files -longDescription -instructions -tests')
      .sort({ category: 1, difficulty: 1, createdAt: 1 })
      .lean();

    if (!userId) {
      return projects.map((p) => ({ ...p, userStatus: null }));
    }

    const userProjects = await UserProject.find({ userId }).lean();
    const byProject = new Map(userProjects.map((up) => [up.projectId, up]));

    return projects.map((p) => {
      const up = byProject.get(p._id.toString());
      return {
        ...p,
        userStatus: up
          ? { status: up.status, completedAt: up.completedAt }
          : null,
      };
    });
  },

  async getBySlug(slug: string, userId?: string) {
    const project = await Project.findOne({ slug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    let userProject = null;
    if (userId) {
      userProject = await UserProject.findOne({
        userId,
        projectId: project._id.toString(),
      }).lean();
    }

    return { project, userProject };
  },

  async startOrGetUserProject(userId: string, projectSlug: string) {
    const project = await Project.findOne({ slug: projectSlug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    let userProject = await UserProject.findOne({
      userId,
      projectId: project._id.toString(),
    });

    if (!userProject) {
      userProject = await UserProject.create({
        userId,
        projectId: project._id.toString(),
        files: project.files.map((f) => ({ ...f })),
        status: 'in_progress',
      });

      await activityService.record({
        userId,
        type: 'project_saved',
        refId: project._id.toString(),
        xp: 0,
      });
    }

    return { project, userProject: userProject.toObject() };
  },

  async saveUserProject(
    userId: string,
    projectSlug: string,
    files: { name: string; language: string; content: string; isEntry?: boolean }[]
  ) {
    const project = await Project.findOne({ slug: projectSlug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const existing = await UserProject.findOne({
      userId,
      projectId: project._id.toString(),
    });

    if (!existing) {
      const created = await UserProject.create({
        userId,
        projectId: project._id.toString(),
        files,
        status: 'in_progress',
      });

      await activityService.record({
        userId,
        type: 'project_saved',
        refId: project._id.toString(),
        xp: 0,
      });

      return created.toObject();
    }

    existing.files = files as typeof existing.files;
    await existing.save();
    return existing.toObject();
  },

  async completeUserProject(userId: string, projectSlug: string) {
    const project = await Project.findOne({ slug: projectSlug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const up = await UserProject.findOne({
      userId,
      projectId: project._id.toString(),
    });
    if (!up) throw new ApiError(404, 'Project not started');

    if (up.status !== 'completed') {
      up.status = 'completed';
      up.completedAt = new Date();
      await up.save();

      await activityService.record({
        userId,
        type: 'project_completed',
        refId: project._id.toString(),
        xp: project.xpReward,
      });
    }

    return up.toObject();
  },

  async listUserProjects(userId: string) {
    const userProjects = await UserProject.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    const projectIds = userProjects.map((up) => up.projectId);
    const projects = await Project.find({ _id: { $in: projectIds } })
      .select('-files -tests')
      .lean();
    const byId = new Map(projects.map((p) => [p._id.toString(), p]));

    return userProjects
      .map((up) => {
        const p = byId.get(up.projectId);
        if (!p) return null;
        return {
          _id: up._id,
          status: up.status,
          completedAt: up.completedAt,
          updatedAt: up.updatedAt,
          project: p,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  },

  /* ─── Submissions ────────────────────────────────────────────── */

  async submitProject(input: SubmitProjectInput) {
    const project = await Project.findOne({ slug: input.projectSlug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const projectId = project._id.toString();

    let snapshotFiles: typeof project.files;
    const userProject = await UserProject.findOne({
      userId: input.userId,
      projectId,
    });

    if (input.files && input.files.length > 0) {
      snapshotFiles = input.files as typeof project.files;
    } else if (userProject && userProject.files.length > 0) {
      snapshotFiles = userProject.files as typeof project.files;
    } else {
      snapshotFiles = project.files;
    }

    const last = await ProjectSubmission.findOne({
      userId: input.userId,
      projectId,
    })
      .sort({ attemptNumber: -1 })
      .select('attemptNumber')
      .lean();

    let nextAttempt = (last?.attemptNumber ?? 0) + 1;

    const testRun = input.testRun
      ? {
          ...input.testRun,
          ranAt:
            input.testRun.ranAt instanceof Date
              ? input.testRun.ranAt
              : new Date(input.testRun.ranAt),
        }
      : undefined;

    const screenshots = input.screenshots;

    let submission;
    for (let retry = 0; retry < 3; retry++) {
      try {
        submission = await ProjectSubmission.create({
          userId: input.userId,
          projectId,
          attemptNumber: nextAttempt,
          files: snapshotFiles,
          status: 'submitted',
          submittedAt: new Date(),
          notes: input.notes,
          testRun,
          screenshots,
        });
        break;
      } catch (err) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: number }).code === 11000
        ) {
          nextAttempt++;
          continue;
        }
        throw err;
      }
    }

    if (!submission) {
      throw new ApiError(500, 'Could not allocate a submission number');
    }

    if (userProject) {
      userProject.status = 'submitted';
      await userProject.save();
    }

    // Notify reviewers. Fire-and-forget — the submission is saved
    // regardless of whether the notification lands.
    void notifyReviewersOfSubmission({
      projectId,
      submissionId: String(submission._id),
      attemptNumber: submission.attemptNumber,
      studentId: input.userId,
    });

    return submission.toObject();
  },

  async listSubmissions(userId: string, projectSlug: string) {
    const project = await Project.findOne({ slug: projectSlug })
      .select('_id')
      .lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const submissions = await ProjectSubmission.find({
      userId,
      projectId: project._id.toString(),
    })
      .sort({ attemptNumber: -1 })
      .lean();

    return attachInstructorFeedback(submissions);
  },

  async getSubmission(userId: string, submissionId: string) {
    const sub = await ProjectSubmission.findById(submissionId).lean();
    if (!sub) throw new ApiError(404, 'Submission not found');
    if (sub.userId !== userId) {
      throw new ApiError(403, 'This submission does not belong to you');
    }
    const [withFeedback] = await attachInstructorFeedback([sub]);
    return withFeedback;
  },

  async getSubmissionForAdmin(submissionId: string) {
    const sub = await ProjectSubmission.findById(submissionId).lean();
    if (!sub) throw new ApiError(404, 'Submission not found');

    const student = await User.findById(sub.userId)
      .select('_id name email avatar')
      .lean();

    return {
      ...sub,
      _id: String(sub._id),
      student: {
        _id: sub.userId,
        name: student?.name ?? '(unknown)',
        email: student?.email ?? '',
        avatar: student?.avatar,
      },
    };
  },

  async listSubmissionsForAdmin(projectSlug: string) {
    const project = await Project.findOne({ slug: projectSlug })
      .select('_id')
      .lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const submissions = await ProjectSubmission.find({
      projectId: project._id.toString(),
    })
      .sort({ submittedAt: -1 })
      .lean();

    const userIds = Array.from(new Set(submissions.map((s) => s.userId)));
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email avatar')
      .lean();
    const byId = new Map(users.map((u) => [u._id.toString(), u]));

    return submissions.map((s) => {
      const u = byId.get(s.userId);
      return {
        ...s,
        student: {
          _id: s.userId,
          name: u?.name ?? '(unknown)',
          email: u?.email ?? '',
          avatar: u?.avatar,
        },
      };
    });
  },
};

/**
 * Notify the project's reviewers that a student submitted.
 *
 * "Reviewers" today means every instructor, because
 * `projectReviewAccessService` is permissive until projects attach
 * to courses. Once that lands, this resolves to the course team
 * instead. The notification is `inAppOnly` — a batch of submissions
 * is not email-worthy.
 */
async function notifyReviewersOfSubmission(input: {
  projectId: string;
  submissionId: string;
  attemptNumber: number;
  studentId: string;
}): Promise<void> {
  try {
    const [project, student, instructors] = await Promise.all([
      Project.findById(input.projectId).select('title slug').lean(),
      User.findById(input.studentId).select('name').lean(),
      User.find({ role: { $in: ['instructor', 'admin'] } })
        .select('_id')
        .lean(),
    ]);

    if (!project || !student) return;

    const reviewerIds = instructors.map((u) => String(u._id));
    if (reviewerIds.length === 0) return;

    await notificationService.fanOut({
      userIds: reviewerIds,
      type: 'project_submitted',
      title: `${student.name} submitted "${project.title}"`,
      body: `Attempt #${input.attemptNumber} is ready for review.`,
      link: `/instructor/submissions/${input.submissionId}`,
      metadata: {
        submissionId: input.submissionId,
        projectId: input.projectId,
      },
      inAppOnly: true,
    });
  } catch (err) {
    logger.warn('Failed to notify reviewers of submission', {
      submissionId: input.submissionId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}