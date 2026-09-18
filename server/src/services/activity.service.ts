import { Activity, type ActivityType } from '../models/Activity.model.js';
import { User } from '../models/User.model.js';
import { achievementService } from './achievement.service.js';

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
  /**
   * Log an activity. Updates:
   * - Activity collection (for heatmap, analytics)
   * - User.xp (increment)
   * - User.streak (increment if new day, reset if gap)
   * - Achievement unlocks (delegated)
   */
  async record(input: RecordInput) {
    const day = todayKey();
    const xp = input.xp ?? 0;

    // 1. Log the activity
    await Activity.create({
      userId: input.userId,
      type: input.type,
      refId: input.refId,
      xp,
      day,
    });

    // 2. Update user XP + streak
    const user = await User.findById(input.userId);
    if (!user) return;

    if (xp > 0) {
      user.xp += xp;
    }

    const lastDay = user.lastActiveDay; // we'll add this field
    if (lastDay !== day) {
      if (!lastDay) {
        user.streak = 1;
      } else {
        const diff = dayDiff(lastDay, day);
        if (diff === 1) {
          user.streak = (user.streak ?? 0) + 1;
        } else if (diff > 1) {
          user.streak = 1;
        }
        // diff === 0 handled above
      }
      user.lastActiveDay = day;
    }

    user.lastActiveAt = new Date();
    await user.save();

    // 3. Unlock any achievements
    try {
      await achievementService.evaluate(input.userId);
    } catch (err) {
      // Non-fatal — log but don't break the request
      console.error('Achievement evaluation failed:', err);
    }
  },

  /**
   * Aggregate activity for the last N days (default 365) as
   * [{ day: 'YYYY-MM-DD', count, xp }]. Missing days = 0.
   */
  async heatmap(userId: string, days = 365) {
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    const fromKey = todayKeyFromDate(from);

    const rows = await Activity.aggregate<{ _id: string; count: number; xp: number }>([
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

  /**
   * Per-week XP for last N weeks (for analytics chart).
   */
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

  /**
   * Count of distinct days the user was active within the last N days.
   */
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