import { Class } from '../models/Class.model.js';
import { logger } from '../utils/logger.js';

/**
 * Class lifecycle automation.
 *
 * Rules:
 *  - `scheduled` + scheduledAt <= now → `live`
 *  - `live` + (scheduledAt + durationMinutes + 15min grace) <= now → `ended`
 *
 * Runs on server start and every 60 seconds.
 */

let timer: NodeJS.Timeout | null = null;

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
  } catch (err) {
    logger.error('Class lifecycle job failed', {
      err: err instanceof Error ? err.message : String(err),
    });
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