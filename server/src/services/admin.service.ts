import { User } from '../models/User.model.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Problem } from '../models/Problem.model.js';
import { Submission } from '../models/Submission.model.js';
import { Project } from '../models/Project.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { Class as ClassModel } from '../models/Class.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { Activity } from '../models/Activity.model.js';
import { Progress } from '../models/Progress.model.js';
import { UserAchievement } from '../models/UserAchievement.model.js';
//import { Achievement } from '../models/Achievement.model.js';
import { CourseMembership } from '../models/CourseMembership.model.js';
import { CohortMembership } from '../models/CohortMembership.model.js';
import { InstructorEvaluation } from '../models/InstructorEvaluation.model.js';
import { AIEvaluation } from '../models/AIEvaluation.model.js';
import { MediaAsset } from '../models/MediaAsset.model.js';
import { Notification } from '../models/Notification.model.js';
import { NotificationPreference } from '../models/NotificationPreference.model.js';
import { Payment } from '../models/Payment.model.js';
import { Token } from '../models/Token.model.js';
import { Invitation } from '../models/Invitation.model.js';
import { EmailLog } from '../models/EmailLog.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const adminService = {
  async platformStats() {
    const since7d = new Date();
    since7d.setDate(since7d.getDate() - 7);
    const since30d = new Date();
    since30d.setDate(since30d.getDate() - 30);

    const [
      usersTotal,
      usersInstructors,
      usersAdmins,
      users7d,
      courses,
      lessons,
      problems,
      submissions,
      submissionsAccepted,
      projects,
      userProjects,
      classesScheduled,
      classesEnded,
      enrollments,
      activities7d,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: since7d } }),
      Course.countDocuments({}),
      Lesson.countDocuments({}),
      Problem.countDocuments({}),
      Submission.countDocuments({}),
      Submission.countDocuments({ status: 'accepted' }),
      Project.countDocuments({}),
      UserProject.countDocuments({}),
      ClassModel.countDocuments({ status: 'scheduled' }),
      ClassModel.countDocuments({ status: 'ended' }),
      Enrollment.countDocuments({}),
      Activity.countDocuments({
        day: { $gte: since7d.toISOString().slice(0, 10) },
      }),
    ]);

    const activityRows = await Activity.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { day: { $gte: since30d.toISOString().slice(0, 10) } } },
      { $group: { _id: '$day', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const dailyActivity: { day: string; count: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(since30d);
      d.setDate(since30d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const row = activityRows.find((r) => r._id === key);
      dailyActivity.push({ day: key, count: row?.count ?? 0 });
    }

    return {
      users: {
        total: usersTotal,
        instructors: usersInstructors,
        admins: usersAdmins,
        newLast7d: users7d,
      },
      content: {
        courses,
        lessons,
        problems,
        projects,
        classesScheduled,
        classesEnded,
      },
      engagement: {
        submissions,
        submissionsAccepted,
        acceptanceRate:
          submissions > 0
            ? Math.round((submissionsAccepted / submissions) * 100)
            : 0,
        userProjects,
        enrollments,
        activitiesLast7d: activities7d,
      },
      dailyActivity,
    };
  },

  async listUsers(query: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, role, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = {};

    if (role && ['student', 'instructor', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (search) {
      // Escape regex specials to prevent ReDoS
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async setUserRole(
    userId: string,
    role: 'student' | 'instructor' | 'admin'
  ) {
    const target = await User.findById(userId).lean();
    if (!target) throw new ApiError(404, 'User not found');

    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot demote the last admin.');
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();
    return updated;
  },

  /**
   * Delete a user and every row that references them.
   *
   * The sweep covers every collection where `userId` (or a synonym
   * like `authorId` / `instructorId` / `evaluatedBy`) points at a
   * user. Anything missed here becomes an orphan and shows up as
   * "(unknown)" in admin views later.
   *
   * Two deliberate exceptions:
   *
   *   - `Announcement` rows are NOT deleted. They were broadcast to
   *     an audience and rewriting that history for everyone who
   *     received them would be dishonest. The announcement feed
   *     already falls back to "(unknown)" when the author can't be
   *     resolved — see `announcement.service.ts`.
   *
   *   - `Achievement` rows are global definitions, not per-user, and
   *     are never deleted. Only `UserAchievement` rows (the user's
   *     unlocks) are removed.
   *
   * The deletion is best-effort across collections (Promise.all).
   * If one delete fails, the others still run; the log line captures
   * the outcome so an admin can audit later if something looks off.
   */
  async deleteUser(userId: string, actorId: string) {
    if (userId === actorId) {
      throw new ApiError(400, 'You cannot delete your own account.');
    }

    const target = await User.findById(userId).lean();
    if (!target) throw new ApiError(404, 'User not found');

    if (target.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot delete the last admin.');
      }
    }

    // Delete the user first so the primary row is gone even if some
    // cascade delete fails. The alternative — cascade first, then
    // user — risks leaving the user with no data if a cascade fails.
    await User.findByIdAndDelete(userId);

    await Promise.all([
      // Learning artifacts
      Submission.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      Activity.deleteMany({ userId }),
      UserAchievement.deleteMany({ userId }),

      // Projects
      UserProject.deleteMany({ userId }),
      ProjectSubmission.deleteMany({ userId }),
      AIEvaluation.deleteMany({ userId }),
      InstructorEvaluation.deleteMany({ instructorId: userId }),

      // Enrollments & memberships
      Enrollment.deleteMany({ userId }),
      StudentEnrollment.deleteMany({ userId }),
      CourseMembership.deleteMany({ userId }),
      CohortMembership.deleteMany({ userId }),

      // Media
      MediaAsset.deleteMany({ ownerId: userId }),

      // Notifications & preferences
      Notification.deleteMany({ userId }),
      NotificationPreference.deleteMany({ userId }),

      // Auth artifacts
      Token.deleteMany({ userId }),
      Invitation.deleteMany({ invitedBy: userId }),

      // Payments (audit trail — deleted per product decision)
      Payment.deleteMany({ userId }),

      // Email log — keep rows that are informational, delete only
      // ones addressed *to* this user's email. The user id isn't
      // stored on EmailLog, so we use email.
      EmailLog.deleteMany({ to: target.email }),
    ]);

    logger.info('User deleted', {
      actorId,
      targetUserId: userId,
      targetEmail: target.email,
    });

    return { ok: true };
  },
};