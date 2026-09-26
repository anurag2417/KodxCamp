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
      return {
        ...existing,
        currentStepIndex: existing.currentStepIndex ?? 0,
        completedSteps: existing.completedSteps ?? [],
        completedChallenges: existing.completedChallenges ?? {},
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
      completedChallenges: {},
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
        completedChallenges: {},
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
      completedChallenges: progress.completedChallenges ?? {},
    };
  },

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
        completedChallenges: {},
        percentage: 0,
      });
    }

    const existing = new Set(progress.completedSteps ?? []);
    const alreadyDone = existing.has(stepIndex);

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

    if (sorted.length === totalSteps) {
      await this.markLessonComplete(userId, courseId, lessonId);
    }

    return {
      ...progress.toObject(),
      currentStepIndex: progress.currentStepIndex ?? 0,
      completedSteps: progress.completedSteps ?? [],
      completedChallenges: progress.completedChallenges ?? {},
    };
  },

  /**
   * Mark a tutorial challenge complete inside a lesson.
   *
   * Guardrails mirror `markStepComplete`:
   *   - The lesson must exist and belong to the course.
   *   - The challenge index must be within bounds.
   *   - Reachability: the student can only mark challenge N complete
   *     if every challenge before it is already complete. This
   *     prevents skipping ahead.
   *
   * Completion of all challenges does NOT auto-complete the lesson.
   * A lesson can have both challenges and steps; the lesson is
   * complete when its own `markLessonComplete` is called. This keeps
   * the two progress axes orthogonal.
   */
  async markChallengeComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    challengeIndex: number
  ) {
    if (!Number.isInteger(challengeIndex) || challengeIndex < 0) {
      throw new ApiError(400, 'challengeIndex must be a non-negative integer');
    }

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson || lesson.courseId !== courseId) {
      throw new ApiError(404, 'Lesson not found in this course');
    }

    const totalChallenges = lesson.tutorialChallenges?.length ?? 0;
    if (totalChallenges === 0) {
      throw new ApiError(400, 'This lesson has no tutorial challenges');
    }
    if (challengeIndex >= totalChallenges) {
      throw new ApiError(
        400,
        `challengeIndex ${challengeIndex} is out of bounds (lesson has ${totalChallenges} challenges)`
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
        completedChallenges: {},
        percentage: 0,
      });
    }

    const map: Record<string, number[]> = progress.completedChallenges ?? {};
    const list = new Set(map[lessonId] ?? []);
    const alreadyDone = list.has(challengeIndex);

    if (!alreadyDone) {
      for (let i = 0; i < challengeIndex; i++) {
        if (!list.has(i)) {
          throw new ApiError(
            400,
            `Challenge ${challengeIndex} is locked - complete challenge ${i} first`
          );
        }
      }
      list.add(challengeIndex);
    }

    const sorted = Array.from(list).sort((a, b) => a - b);
    map[lessonId] = sorted;

    progress.completedChallenges = map;
    progress.currentLessonId = lessonId;
    await progress.save();

    return {
      ...progress.toObject(),
      currentStepIndex: progress.currentStepIndex ?? 0,
      completedSteps: progress.completedSteps ?? [],
      completedChallenges: progress.completedChallenges ?? {},
    };
  },
};