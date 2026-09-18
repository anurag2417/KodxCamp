import { Activity } from '../models/Activity.model.js';
import { Submission } from '../models/Submission.model.js';
import { Progress } from '../models/Progress.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { Course } from '../models/Course.model.js';
import { Problem } from '../models/Problem.model.js';
import { activityService } from './activity.service.js';

export const analyticsService = {
  /**
   * Overview stats for the Progress page + dashboard.
   */
  async overview(userId: string) {
    const [
      activityRows,
      lessonsAgg,
      solvedDistinct,
      attemptedDistinct,
      projectsStarted,
      projectsCompleted,
    ] = await Promise.all([
      Activity.find({ userId }).select('type xp day').lean(),
      Progress.find({ userId }).lean(),
      Submission.distinct('problemId', { userId, status: 'accepted' }),
      Submission.distinct('problemId', { userId }),
      UserProject.countDocuments({ userId }),
      UserProject.countDocuments({ userId, status: 'completed' }),
    ]);

    const lessonsCompleted = lessonsAgg.reduce(
      (s, p) => s + (p.completedLessons?.length ?? 0),
      0
    );
    const coursesInProgress = lessonsAgg.filter(
      (p) => (p.completedLessons?.length ?? 0) > 0 && p.percentage < 100
    ).length;
    const coursesCompleted = lessonsAgg.filter((p) => p.percentage >= 100).length;

    const classesAttended = activityRows.filter((a) => a.type === 'class_attended').length;
    const recordingsWatched = activityRows.filter((a) => a.type === 'recording_watched').length;

    const totalXp = activityRows.reduce((s, a) => s + (a.xp ?? 0), 0);
    const activeDays30 = await activityService.activeDaysCount(userId, 30);

    return {
      lessonsCompleted,
      coursesInProgress,
      coursesCompleted,
      problemsSolved: solvedDistinct.length,
      problemsAttempted: attemptedDistinct.length,
      projectsStarted,
      projectsCompleted,
      classesAttended,
      recordingsWatched,
      totalXp,
      activeDays30,
      totalActivities: activityRows.length,
    };
  },

  /**
   * Per-course progress for the Progress page list.
   */
  async perCourse(userId: string) {
    const progresses = await Progress.find({ userId }).lean();
    const courseIds = progresses.map((p) => p.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } }).lean();
    const byId = new Map(courses.map((c) => [c._id.toString(), c]));

    return progresses
      .map((p) => {
        const c = byId.get(p.courseId);
        if (!c) return null;
        return {
          courseId: p.courseId,
          title: c.title,
          slug: c.slug,
          language: c.language,
          completedLessons: p.completedLessons?.length ?? 0,
          totalLessons: c.totalLessons,
          percentage: p.percentage,
          updatedAt: p.updatedAt,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  },

  /**
   * Difficulty breakdown of solved problems.
   */
  async difficultyBreakdown(userId: string) {
    const solvedIds = await Submission.distinct('problemId', {
      userId,
      status: 'accepted',
    });
    const problems = await Problem.find({ _id: { $in: solvedIds } })
      .select('difficulty')
      .lean();

    const buckets = { easy: 0, medium: 0, hard: 0 };
    for (const p of problems) {
      buckets[p.difficulty as 'easy' | 'medium' | 'hard']++;
    }
    return buckets;
  },

  /**
   * Weekly XP chart for the analytics page.
   */
  async weekly(userId: string, weeks = 12) {
    return activityService.weeklyXp(userId, weeks);
  },

  /**
   * Recent activity feed (last N events).
   */
  async recentActivity(userId: string, limit = 20) {
    const rows = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Enrich with titles where possible
    const { Course } = await import('../models/Course.model.js');
    const { Problem } = await import('../models/Problem.model.js');
    const { Project } = await import('../models/Project.model.js');
    const { Class: ClassModel } = await import('../models/Class.model.js');

    const enriched = await Promise.all(
      rows.map(async (r) => {
        let label = r.type;
        let title = '';
        let link = '';

        if (r.type === 'lesson_completed' && r.refId) {
          const { Lesson } = await import('../models/Lesson.model.js');
          const lesson = await Lesson.findById(r.refId).lean();
          if (lesson) {
            title = lesson.title;
            const course = await Course.findById(lesson.courseId).lean();
            if (course) link = `/courses/${course.slug}/lessons/${lesson.slug}`;
          }
        } else if (r.type.startsWith('problem_') && r.refId) {
          const p = await Problem.findById(r.refId).lean();
          if (p) {
            title = p.title;
            link = `/practice/${p.slug}`;
          }
        } else if (r.type.startsWith('project_') && r.refId) {
          const p = await Project.findById(r.refId).lean();
          if (p) {
            title = p.title;
            link = `/projects/${p.slug}`;
          }
        } else if (r.type.startsWith('class_') || r.type === 'recording_watched') {
          if (r.refId) {
            const c = await ClassModel.findById(r.refId).lean();
            if (c) {
              title = c.title;
              link = `/classes/${c.slug}`;
            }
          }
        }

        return {
          _id: r._id,
          type: r.type,
          xp: r.xp,
          title,
          link,
          createdAt: (r as unknown as { createdAt: Date }).createdAt,
        };
      })
    );

    return enriched;
  },
};