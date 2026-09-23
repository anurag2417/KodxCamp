import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { logger } from '../utils/logger.js';

/**
 * Creates (or leaves alone) a StudentEnrollment row.
 *
 * Idempotent: if the student is already enrolled in this course, the
 * `joinedAt` and `source` are preserved. Only the first caller wins.
 *
 * Called from `activityService.record` and
 * `progressService.markLessonComplete`. Fire-and-forget from those
 * callers — a failure here shouldn't block the activity from being
 * recorded.
 */
export const studentEnrollmentService = {
  async ensureEnrollment(input: {
    userId: string;
    courseId: string;
    source: 'activity' | 'progress' | 'explicit';
    at?: Date;
  }): Promise<void> {
    try {
      await StudentEnrollment.updateOne(
        { userId: input.userId, courseId: input.courseId },
        {
          $setOnInsert: {
            userId: input.userId,
            courseId: input.courseId,
            joinedAt: input.at ?? new Date(),
            source: input.source,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      // Duplicate-key race: two parallel requests both tried to
      // insert. The `$setOnInsert` + unique index means one wins, the
      // other gets E11000. That's fine — ignore it.
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 11000
      ) {
        return;
      }
      logger.warn('StudentEnrollment upsert failed', {
        userId: input.userId,
        courseId: input.courseId,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },
};