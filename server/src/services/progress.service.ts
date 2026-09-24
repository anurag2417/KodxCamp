import { Progress } from '../models/Progress.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { activityService } from './activity.service.js';
import { studentEnrollmentService } from './studentEnrollment.service.js';
import { ApiError } from '../utils/ApiError.js';

const XP_PER_LESSON = 25;

export const progressService = {
  async getForCourse(userId: string, courseId: string) {
    const existing = await Progress.findOne({ userId, courseId }).lean();
    if (existing) {
      // Normalize undefined step fields so callers never have to
      // guess whether the doc predates the step feature.
      return {
        ...existing,
        currentStepIndex: existing.currentStepIndex ?? 0,
        completedSteps: existing.completedSteps ?? [],
      };
    }

    return {
      _id: null,
      userId,
      courseId,
      completedLessons: [],
      currentLessonId: undefined,
      currentStepIndex: 0,
      completedSteps: [],
      percentage: 0,
      updatedAt: new Date(),
    };
  },

  async markLessonComplete(userId: string, courseId: string, lessonId: string) {
    const totalLessons = await Lesson.countDocuments({ courseId });
    if (totalLessons === 0) {
      return { completedLessons: [], percentage: 0 };
    }

    let progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      progress = await Progress.create({
        userId,
        courseId,
        completedLessons: [],
        currentStepIndex: 0,
        completedSteps: [],
        percentage: 0,
      });
    }

    const wasNew = !progress.completedLessons.includes(lessonId);
    if (wasNew) {
      progress.completedLessons.push(lessonId);
    }

    progress.currentLessonId = lessonId;
    progress.percentage = Math.round(
      (progress.completedLessons.length / totalLessons) * 100
    );
    await progress.save();

    if (wasNew) {
      await activityService.record({
        userId,
        type: 'lesson_completed',
        refId: lessonId,
        xp: XP_PER_LESSON,
      });

      await studentEnrollmentService.ensureEnrollment({
        userId,
        courseId,
        source: 'progress',
      });
    }

    return {
      ...progress.toObject(),
      currentStepIndex: progress.currentStepIndex ?? 0,
      completedSteps: progress.completedSteps ?? [],
    };
  },

  /**
   * Mark a step complete inside a step-by-step web lesson.
   *
   * Guardrails:
   *   - The lesson must exist and belong to the course.
   *   - The step index must be within bounds.
   *   - The step index must be reachable: the student cannot skip
   *     ahead. "Reachable" means `stepIndex <= completedSteps.length`
   *     after sorting + dedup. We accept any prefix-complete set, not
   *     just strict in-order, so retrying an earlier step is fine.
   *
   * Writing is idempotent. The response always reflects the normalized
   * shape (currentStepIndex + completedSteps as arrays, never
   * undefined).
   */
  async markStepComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    stepIndex: number
  ) {
    if (!Number.isInteger(stepIndex) || stepIndex < 0) {
      throw new ApiError(400, 'stepIndex must be a non-negative integer');
    }

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson || lesson.courseId !== courseId) {
      throw new ApiError(404, 'Lesson not found in this course');
    }

    const totalSteps = lesson.steps?.length ?? 0;
    if (totalSteps === 0) {
      throw new ApiError(
        400,
        'This lesson has no steps - use markLessonComplete instead'
      );
    }
    if (stepIndex >= totalSteps) {
      throw new ApiError(
        400,
        `stepIndex ${stepIndex} is out of bounds (lesson has ${totalSteps} steps)`
      );
    }

    let progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      progress = await Progress.create({
        userId,
        courseId,
        completedLessons: [],
        currentStepIndex: 0,
        completedSteps: [],
        percentage: 0,
      });
    }

    const existing = new Set(progress.completedSteps ?? []);
    const alreadyDone = existing.has(stepIndex);

    // Reachability: the student can only mark step N if every step
    // before it is already done. This blocks skipping ahead while
    // allowing re-marking of any completed step.
    if (!alreadyDone) {
      for (let i = 0; i < stepIndex; i++) {
        if (!existing.has(i)) {
          throw new ApiError(
            400,
            `Step ${stepIndex} is locked - complete step ${i} first`
          );
        }
      }
      existing.add(stepIndex);
    }

    const sorted = Array.from(existing).sort((a, b) => a - b);
    const highestCompleted = sorted.length > 0 ? sorted[sorted.length - 1] : -1;
    const nextIndex = Math.min(highestCompleted + 1, totalSteps - 1);

    progress.completedSteps = sorted;
    progress.currentStepIndex = nextIndex;
    progress.currentLessonId = lessonId;
    await progress.save();

    // If the student just completed the final step, auto-mark the
    // lesson itself complete. This keeps the existing lesson-complete
    // flow (XP, enrollment, activity) working for step-by-step
    // lessons without the student having to click a separate button.
    if (sorted.length === totalSteps) {
      await this.markLessonComplete(userId, courseId, lessonId);
    }

    return {
      ...progress.toObject(),
      currentStepIndex: progress.currentStepIndex ?? 0,
      completedSteps: progress.completedSteps ?? [],
    };
  },
};