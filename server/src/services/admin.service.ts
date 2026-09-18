import { User } from '../models/User.model.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Problem } from '../models/Problem.model.js';
import { Submission } from '../models/Submission.model.js';
import { Project } from '../models/Project.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { Class as ClassModel } from '../models/Class.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { Activity } from '../models/Activity.model.js';
import { Progress } from '../models/Progress.model.js';
import { UserAchievement } from '../models/UserAchievement.model.js';
import { ApiError } from '../utils/ApiError.js';

export const adminService = {
  /**
   * Top-level platform stats for the admin dashboard.
   */
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
      Activity.countDocuments({ day: { $gte: since7d.toISOString().slice(0, 10) } }),
    ]);

    // Daily activity for last 30 days — for the chart
    const activityRows = await Activity.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          day: { $gte: since30d.toISOString().slice(0, 10) },
        },
      },
      { $group: { _id: '$day', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Fill gaps
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
          submissions > 0 ? Math.round((submissionsAccepted / submissions) * 100) : 0,
        userProjects,
        enrollments,
        activitiesLast7d: activities7d,
      },
      dailyActivity,
    };
  },

  async listUsers(query: { search?: string; role?: string; page?: number; limit?: number }) {
    const { search, role, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = {};
    if (role && ['student', 'instructor', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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

  async setUserRole(userId: string, role: 'student' | 'instructor' | 'admin') {
    const target = await User.findById(userId).lean();
    if (!target) throw new ApiError(404, 'User not found');

    // Prevent demoting the last admin
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

    await User.findByIdAndDelete(userId);
    await Promise.all([
      Submission.deleteMany({ userId }),
      UserProject.deleteMany({ userId }),
      Enrollment.deleteMany({ userId }),
      Activity.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      UserAchievement.deleteMany({ userId }),
    ]);

    return { ok: true };
  }
};