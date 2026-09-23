import { Activity, type ActivityType } from '../models/Activity.model.js';
import { User } from '../models/User.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { achievementService } from './achievement.service.js';
import { studentEnrollmentService } from './studentEnrollment.service.js';
import { logger } from '../utils/logger.js';

interface RecordInput {
  userId: string;
  type: ActivityType;
  refId?: string;
  xp?: number;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayDiff(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  const ta = Date.UTC(ya, ma - 1, da);
  const tb = Date.UTC(yb, mb - 1, db);
  return Math.round((tb - ta) / (1000 * 60 * 60 * 24));
}

export const activityService = {
  async record(input: RecordInput) {
    const day = todayKey();
    const xp = input.xp ?? 0;

    // 1. Log the activity.
    await Activity.create({
      userId: input.userId,
      type: input.type,
      refId: input.refId,
      xp,
      day,
    });

    // 2. Upsert a StudentEnrollment if the activity is course-scoped.
    //    `lesson_completed` is the main trigger. If we ever add
    //    course-scoped problem activities, they'd join here too.
    if (input.type === 'lesson_completed' && input.refId) {
      const lesson = await Lesson.findById(input.refId)
        .select('courseId')
        .lean();
      if (lesson) {
        void studentEnrollmentService.ensureEnrollment({
          userId: input.userId,
          courseId: lesson.courseId,
          source: 'activity',
        });
      }
    }

    // 3. Update XP atomically.
    if (xp > 0) {
      await User.updateOne(
        { _id: input.userId },
        { $inc: { xp }, $set: { lastActiveAt: new Date() } }
      );
    } else {
      await User.updateOne(
        { _id: input.userId },
        { $set: { lastActiveAt: new Date() } }
      );
    }

    // 4. Update streak.
    const user = await User.findById(input.userId)
      .select('lastActiveDay streak')
      .lean();
    if (!user) return;

    const lastDay = user.lastActiveDay;

    if (lastDay !== day) {
      let nextStreak: number;
      if (!lastDay) {
        nextStreak = 1;
      } else {
        const diff = dayDiff(lastDay, day);
        if (diff === 1) nextStreak = (user.streak ?? 0) + 1;
        else if (diff > 1) nextStreak = 1;
        else nextStreak = user.streak ?? 1;
      }

      await User.updateOne(
        { _id: input.userId, lastActiveDay: lastDay ?? { $exists: false } },
        { $set: { lastActiveDay: day, streak: nextStreak } }
      );
    }

    // 5. Fire-and-forget achievements.
    void achievementService
      .evaluate(input.userId)
      .catch((err) =>
        logger.error('Achievement evaluation failed', {
          userId: input.userId,
          err: err instanceof Error ? err.message : String(err),
        })
      );
  },

  async heatmap(userId: string, days = 365) {
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    const fromKey = todayKeyFromDate(from);

    const rows = await Activity.aggregate<{
      _id: string;
      count: number;
      xp: number;
    }>([
      { $match: { userId, day: { $gte: fromKey } } },
      {
        $group: {
          _id: '$day',
          count: { $sum: 1 },
          xp: { $sum: '$xp' },
        },
      },
    ]);

    const byDay = new Map(rows.map((r) => [r._id, r]));
    const out: { day: string; count: number; xp: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = todayKeyFromDate(d);
      const row = byDay.get(key);
      out.push({
        day: key,
        count: row?.count ?? 0,
        xp: row?.xp ?? 0,
      });
    }
    return out;
  },

  async weeklyXp(userId: string, weeks = 12) {
    const days = weeks * 7;
    const data = await this.heatmap(userId, days);

    const out: { weekStart: string; xp: number; activities: number }[] = [];
    for (let w = 0; w < weeks; w++) {
      const slice = data.slice(w * 7, w * 7 + 7);
      const weekStart = slice[0]?.day ?? '';
      const xp = slice.reduce((s, d) => s + d.xp, 0);
      const activities = slice.reduce((s, d) => s + d.count, 0);
      out.push({ weekStart, xp, activities });
    }
    return out;
  },

  async activeDaysCount(userId: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    const fromKey = todayKeyFromDate(from);
    const distinct = await Activity.distinct('day', {
      userId,
      day: { $gte: fromKey },
    });
    return distinct.length;
  },
};

function todayKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}