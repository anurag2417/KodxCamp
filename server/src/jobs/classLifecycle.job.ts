import { Class } from '../models/Class.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { CohortMembership } from '../models/CohortMembership.model.js';
import { notificationService } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

/**
 * Class lifecycle automation.
 *
 * Rules:
 *  - `scheduled` + scheduledAt <= now → `live`
 *  - `live` + (scheduledAt + durationMinutes + 15min grace) <= now → `ended`
 *  - `scheduled` + scheduledAt within the next 15 minutes, and
 *    no reminder sent → fan out a `class_starting_soon`
 *    notification to the class's audience
 *
 * Runs on server start and every 60 seconds.
 *
 * The reminder tick is idempotent thanks to the `reminderSentAt`
 * field — once a reminder fires, the class is excluded from
 * subsequent queries. A job restart mid-cycle doesn't re-fire.
 */

let timer: NodeJS.Timeout | null = null;

const REMINDER_WINDOW_MS = 15 * 60 * 1000;

async function tick() {
  const now = new Date();

  try {
    // scheduled → live
    const toLive = await Class.updateMany(
      {
        status: 'scheduled',
        scheduledAt: { $lte: now },
      },
      { $set: { status: 'live' } }
    );

    if (toLive.modifiedCount > 0) {
      logger.info('Class lifecycle: scheduled → live', {
        count: toLive.modifiedCount,
      });
    }

    // live → ended (with 15 min grace after expected end)
    const liveClasses = await Class.find({ status: 'live' })
      .select('_id scheduledAt durationMinutes')
      .lean();

    const toEnd: string[] = [];
    for (const c of liveClasses) {
      const endTime = new Date(
        new Date(c.scheduledAt).getTime() +
          (c.durationMinutes + 15) * 60 * 1000
      );
      if (endTime <= now) {
        toEnd.push(c._id.toString());
      }
    }

    if (toEnd.length > 0) {
      const result = await Class.updateMany(
        { _id: { $in: toEnd } },
        { $set: { status: 'ended' } }
      );
      logger.info('Class lifecycle: live → ended', {
        count: result.modifiedCount,
      });
    }

    // 15-minute reminders
    await sendUpcomingClassReminders(now);
  } catch (err) {
    logger.error('Class lifecycle job failed', {
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Fan out reminders for classes starting within the next 15
 * minutes. Runs on every tick but finds nothing most of the time —
 * the compound index makes the query cheap.
 */
async function sendUpcomingClassReminders(now: Date): Promise<void> {
  const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const upcoming = await Class.find({
    status: 'scheduled',
    scheduledAt: { $gt: now, $lte: horizon },
    reminderSentAt: { $exists: false },
  })
    .select('_id title slug scheduledAt courseId cohortId')
    .lean();

  if (upcoming.length === 0) return;

  for (const cls of upcoming) {
    try {
      // Union the class's audiences. A class can be course-scoped,
      // cohort-scoped, both, or neither. Neither means "public" —
      // but a public class has no natural recipient set, so we
      // skip.
      const userIds: string[] = [];

      if (cls.courseId) {
        const enrollments = await StudentEnrollment.find({
          courseId: cls.courseId,
        })
          .select('userId')
          .lean();
        userIds.push(...enrollments.map((e) => e.userId));
      }

      if (cls.cohortId) {
        const memberships = await CohortMembership.find({
          cohortId: cls.cohortId,
          role: 'student',
        })
          .select('userId')
          .lean();
        userIds.push(...memberships.map((m) => m.userId));
      }

      // Mark sent first, before fan-out. If the fan-out fails, we
      // lose one reminder rather than spamming the audience on every
      // subsequent tick. That's the honest trade: a lost reminder is
      // recoverable (the class is still on their dashboard), a
      // repeated reminder is not.
      await Class.updateOne(
        { _id: cls._id },
        { $set: { reminderSentAt: new Date() } }
      );

      if (userIds.length === 0) continue;

      await notificationService.fanOut({
        userIds: Array.from(new Set(userIds)),
        type: 'class_starting_soon',
        title: `${cls.title} starts in 15 minutes`,
        body: `Your class "${cls.title}" is starting soon. Open it to join the room.`,
        link: `/classes/${cls.slug}`,
        metadata: { classId: String(cls._id) },
      });

      logger.info('Class reminder sent', {
        classId: String(cls._id),
        recipients: userIds.length,
      });
    } catch (err) {
      logger.warn('Class reminder failed', {
        classId: String(cls._id),
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export function startClassLifecycleJob(): void {
  if (timer) return;
  void tick();
  timer = setInterval(tick, 60_000);
  logger.info('Class lifecycle job started');
}

export function stopClassLifecycleJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('Class lifecycle job stopped');
  }
}