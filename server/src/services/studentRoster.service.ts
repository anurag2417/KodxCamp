import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { User } from '../models/User.model.js';
import { Progress } from '../models/Progress.model.js';
import { Submission } from '../models/Submission.model.js';
import { UserAchievement } from '../models/UserAchievement.model.js';
import { Activity } from '../models/Activity.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Course } from '../models/Course.model.js';
import { Problem } from '../models/Problem.model.js';
import { ApiError } from '../utils/ApiError.js';

export type RosterSort = 'recent' | 'progress' | 'name' | 'joined';

export interface RosterRow {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: Date;
  lastActiveAt: Date;
  lessonsCompleted: number;
  totalLessons: number;
  percentage: number;
  problemsSolved: number;
  submissions: number;
  achievements: number;
}

export interface RosterPage {
  students: RosterRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export const studentRosterService = {
  /**
   * Paginated roster for a course.
   *
   * `search` filters by name or email (case-insensitive). `sort`
   * picks the ordering. The total count is computed before pagination
   * so the client can render "page X of Y".
   */
  async list(input: {
    courseId: string;
    search?: string;
    sort?: RosterSort;
    page?: number;
    limit?: number;
  }): Promise<RosterPage> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    const sort: RosterSort = input.sort ?? 'recent';

    const course = await Course.findById(input.courseId).lean();
    if (!course) throw new ApiError(404, 'Course not found.');

    const totalLessons = await Lesson.countDocuments({
      courseId: input.courseId,
    });

    // If we have a search, we need to pre-resolve matching user ids.
    // Otherwise the aggregation would need to join to User just to
    // filter, which is slower.
    let matchingUserIds: string[] | null = null;
    if (input.search && input.search.trim()) {
      const escaped = input.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const users = await User.find({
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { email: { $regex: escaped, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      matchingUserIds = users.map((u) => u._id.toString());
      if (matchingUserIds.length === 0) {
        return { students: [], total: 0, page, limit, pages: 0 };
      }
    }

    const enrollmentFilter: Record<string, unknown> = {
      courseId: input.courseId,
    };
    if (matchingUserIds) {
      enrollmentFilter.userId = { $in: matchingUserIds };
    }

    const total = await StudentEnrollment.countDocuments(enrollmentFilter);

    // Sort options. `recent` and `progress` need post-join sorting
    // because the sort key lives in a different collection. The other
    // two sort on the enrollment itself.
    const sortStage: Record<string, 1 | -1> =
      sort === 'joined'
        ? { joinedAt: -1 }
        : sort === 'name'
          ? { joinedAt: 1 } // placeholder, we'll re-sort after the join
          : { joinedAt: -1 };

    const enrollments = await StudentEnrollment.find(enrollmentFilter)
      .sort(sortStage)
      .lean();

    const userIds = enrollments.map((e) => e.userId);
    if (userIds.length === 0) {
      return { students: [], total, page, limit, pages: 0 };
    }

    // Batch-fetch everything we need for these students.
    const [users, progresses, submissionCounts, achievementCounts] =
      await Promise.all([
        User.find({ _id: { $in: userIds } })
          .select('_id name email avatar lastActiveAt')
          .lean(),
        Progress.find({
          userId: { $in: userIds },
          courseId: input.courseId,
        }).lean(),
        Submission.aggregate<{ _id: string; count: number }>([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]),
        UserAchievement.aggregate<{ _id: string; count: number }>([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]),
      ]);

    const userById = new Map(users.map((u) => [u._id.toString(), u]));
    const progressByUser = new Map(
      progresses.map((p) => [p.userId, p])
    );
    const submissionsByUser = new Map(
      submissionCounts.map((s) => [s._id, s.count])
    );
    const achievementsByUser = new Map(
      achievementCounts.map((a) => [a._id, a.count])
    );

    // Problem-solve counts per student. `distinct` with a big $in
    // would be expensive per student, so one aggregation over the
    // whole set is cheaper.
    const solvedAgg = await Submission.aggregate<{
      _id: string;
      problems: string[];
    }>([
      { $match: { userId: { $in: userIds }, status: 'accepted' } },
      { $group: { _id: '$userId', problems: { $addToSet: '$problemId' } } },
    ]);
    const solvedByUser = new Map(
      solvedAgg.map((s) => [s._id, s.problems.length])
    );

    // Build the roster rows.
    const rows: RosterRow[] = enrollments.map((e) => {
      const user = userById.get(e.userId);
      const prog = progressByUser.get(e.userId);
      return {
        userId: e.userId,
        name: user?.name ?? '(unknown)',
        email: user?.email ?? '',
        avatar: user?.avatar,
        joinedAt: e.joinedAt,
        lastActiveAt: user?.lastActiveAt ?? e.joinedAt,
        lessonsCompleted: prog?.completedLessons?.length ?? 0,
        totalLessons,
        percentage: prog?.percentage ?? 0,
        problemsSolved: solvedByUser.get(e.userId) ?? 0,
        submissions: submissionsByUser.get(e.userId) ?? 0,
        achievements: achievementsByUser.get(e.userId) ?? 0,
      };
    });

    // Post-join sorting for `recent`, `progress`, and `name`. The
    // other case (`joined`) is already sorted from the query above.
    if (sort === 'recent') {
      rows.sort(
        (a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
      );
    } else if (sort === 'progress') {
      rows.sort((a, b) => b.percentage - a.percentage);
    } else if (sort === 'name') {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    }

    const paged = rows.slice(skip, skip + limit);

    return {
      students: paged,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  /**
   * Detailed view of a single student in a course.
   *
   * Returns their progress, recent activity, and submissions. Scoped
   * to the course for progress; submissions are global because
   * problems aren't tied to courses in the schema.
   */
  async detail(input: { courseId: string; userId: string }) {
    const course = await Course.findById(input.courseId).lean();
    if (!course) throw new ApiError(404, 'Course not found.');

    const user = await User.findById(input.userId)
      .select('_id name email avatar createdAt lastActiveAt xp streak role')
      .lean();
    if (!user) throw new ApiError(404, 'Student not found.');

    const [
      enrollment,
      progress,
      lessons,
      recentActivity,
      submissions,
      solvedProblems,
    ] = await Promise.all([
      StudentEnrollment.findOne({
        userId: input.userId,
        courseId: input.courseId,
      }).lean(),
      Progress.findOne({
        userId: input.userId,
        courseId: input.courseId,
      }).lean(),
      Lesson.find({ courseId: input.courseId })
        .select('_id title slug order')
        .sort({ order: 1 })
        .lean(),
      Activity.find({
        userId: input.userId,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Submission.find({ userId: input.userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Submission.distinct('problemId', {
        userId: input.userId,
        status: 'accepted',
      }),
    ]);

    // Enrich submissions with problem titles.
    const problemIds = Array.from(
      new Set(submissions.map((s) => s.problemId))
    );
    const problems = await Problem.find({ _id: { $in: problemIds } })
      .select('_id title slug difficulty')
      .lean();
    const problemById = new Map(
      problems.map((p) => [p._id.toString(), p])
    );

    // Enrich activity with titles for the recent feed. We reuse the
    // same shape the analytics page produces.
    const enrichedActivity = recentActivity.map((a) => ({
      _id: a._id,
      type: a.type,
      xp: a.xp,
      day: a.day,
      createdAt: (a as unknown as { createdAt: Date }).createdAt,
    }));

    const solvedProblemDocs = await Problem.find({
      _id: { $in: solvedProblems },
    })
      .select('difficulty')
      .lean();
    const difficultySolved = { easy: 0, medium: 0, hard: 0 };
    for (const p of solvedProblemDocs) {
      difficultySolved[p.difficulty as 'easy' | 'medium' | 'hard']++;
    }

    const completedIds = new Set(progress?.completedLessons ?? []);
    const lessonsWithCompletion = lessons.map((l) => ({
      _id: l._id,
      title: l.title,
      slug: l.slug,
      order: l.order,
      completed: completedIds.has(l._id.toString()),
    }));

    return {
      student: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        xp: user.xp,
        streak: user.streak,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
      enrollment: enrollment
        ? { joinedAt: enrollment.joinedAt, source: enrollment.source }
        : null,
      progress: {
        percentage: progress?.percentage ?? 0,
        completedLessons: progress?.completedLessons?.length ?? 0,
        totalLessons: lessons.length,
        lessons: lessonsWithCompletion,
      },
      recentActivity: enrichedActivity,
      submissions: submissions.map((s) => {
        const p = problemById.get(s.problemId);
        return {
          _id: s._id,
          problemId: s.problemId,
          problemTitle: p?.title ?? '(deleted)',
          problemSlug: p?.slug ?? '',
          problemDifficulty: p?.difficulty ?? null,
          language: s.language,
          status: s.status,
          passedTests: s.passedTests ?? 0,
          totalTests: s.totalTests ?? 0,
          runtimeMs: s.runtimeMs,
          createdAt: (s as unknown as { createdAt: Date }).createdAt,
        };
      }),
      submissionsByDifficulty: difficultySolved,
    };
  },
};