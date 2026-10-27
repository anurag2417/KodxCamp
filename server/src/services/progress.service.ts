import { Progress } from '../models/Progress.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { CurriculumItem } from '../models/CurriculumItem.model.js';
import { activityService } from './activity.service.js';
import { activityProgressService } from './activityProgress.service.js';
import { studentEnrollmentService } from './studentEnrollment.service.js';
import { ApiError } from '../utils/ApiError.js';

async function getLessonCurriculumItems(
  courseId: string,
  lessonId: string
) {
  return CurriculumItem.find({
    courseId,
    referenceId: lessonId,
    type: 'lesson',
  }).lean();
}

export const progressService = {
  async getForCourse(userId: string, courseId: string) {
    const progress = await Progress.findOne({
      userId,
      courseId,
    }).lean();

    if (!progress) {
      return {
        userId,
        courseId,
        completedLessons: [],
        currentLessonId: undefined,
        currentStepIndex: 0,
        completedSteps: [],
        completedChallenges: {},
        percentage: 0,
      };
    }

    return progress;
  },

  async markLessonComplete(
    userId: string,
    courseId: string,
    lessonId: string
  ) {
    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId,
    }).lean();

    if (!lesson) {
      throw new ApiError(404, 'Lesson not found');
    }

    const totalLessons = await Lesson.countDocuments({
      courseId,
    });

    let progress = await Progress.findOne({
      userId,
      courseId,
    });

    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        completedLessons: [],
        currentStepIndex: 0,
        completedSteps: [],
        completedChallenges: {},
        percentage: 0,
      });
    }

    const alreadyCompleted =
      progress.completedLessons.includes(lessonId);

    if (!alreadyCompleted) {
      progress.completedLessons.push(lessonId);
    }

    progress.percentage =
      totalLessons > 0
        ? Math.round(
            (progress.completedLessons.length / totalLessons) * 100
          )
        : 0;

    progress.currentLessonId = lessonId;
    progress.currentStepIndex = 0;
    progress.completedSteps = [];

    await progress.save();

    if (!alreadyCompleted) {
      await activityService.record({
        userId,
        type: 'lesson_completed',
      });

      await studentEnrollmentService.ensureEnrollment({
        userId,
        courseId,
        source: 'progress',
      });
    }

    const curriculumItems = await getLessonCurriculumItems(
      courseId,
      lessonId
    );

    for (const item of curriculumItems) {
      await activityProgressService.completeActivity(
        userId,
        courseId,
        item._id.toString()
      );
    }

    return progress;
  },

  async markStepComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    stepIndex: number
  ) {
    if (!Number.isInteger(stepIndex) || stepIndex < 0) {
      throw new ApiError(400, 'Invalid step index');
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId,
    }).lean();

    if (!lesson) {
      throw new ApiError(404, 'Lesson not found');
    }

    const steps = lesson.steps ?? [];

    if (steps.length === 0) {
      throw new ApiError(400, 'This lesson has no steps');
    }

    if (stepIndex >= steps.length) {
      throw new ApiError(400, 'Invalid step index');
    }

    let progress = await Progress.findOne({
      userId,
      courseId,
    });

    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        completedLessons: [],
        currentStepIndex: 0,
        completedSteps: [],
        completedChallenges: {},
        percentage: 0,
      });
    }

    const completedSteps = progress.completedSteps ?? [];

    if (
      stepIndex > 0 &&
      !completedSteps.includes(stepIndex - 1)
    ) {
      throw new ApiError(
        400,
        'Complete the previous step first'
      );
    }

    if (!completedSteps.includes(stepIndex)) {
      completedSteps.push(stepIndex);
      completedSteps.sort((a, b) => a - b);
    }

    progress.completedSteps = completedSteps;
    progress.currentLessonId = lessonId;
    progress.currentStepIndex = stepIndex;

    await progress.save();

    const curriculumItems = await getLessonCurriculumItems(
      courseId,
      lessonId
    );

    for (const item of curriculumItems) {
      await activityProgressService.markStepComplete(
        userId,
        courseId,
        item._id.toString(),
        stepIndex
      );
    }

    if (completedSteps.length === steps.length) {
      return this.markLessonComplete(
        userId,
        courseId,
        lessonId
      );
    }

    return progress;
  },

  async markChallengeComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    challengeIndex: number
  ) {
    if (
      !Number.isInteger(challengeIndex) ||
      challengeIndex < 0
    ) {
      throw new ApiError(400, 'Invalid challenge index');
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId,
    }).lean();

    if (!lesson) {
      throw new ApiError(404, 'Lesson not found');
    }

    const challenges = lesson.tutorialChallenges ?? [];

    if (challenges.length === 0) {
      throw new ApiError(
        400,
        'This lesson has no tutorial challenges'
      );
    }

    if (challengeIndex >= challenges.length) {
      throw new ApiError(
        400,
        'Invalid challenge index'
      );
    }

    let progress = await Progress.findOne({
      userId,
      courseId,
    });

    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        completedLessons: [],
        currentStepIndex: 0,
        completedSteps: [],
        completedChallenges: {},
        percentage: 0,
      });
    }

    const completedChallenges =
      progress.completedChallenges ?? {};

    const lessonChallenges =
      completedChallenges[lessonId] ?? [];

    if (
      challengeIndex > 0 &&
      !lessonChallenges.includes(challengeIndex - 1)
    ) {
      throw new ApiError(
        400,
        'Complete the previous challenge first'
      );
    }

    if (!lessonChallenges.includes(challengeIndex)) {
      lessonChallenges.push(challengeIndex);
      lessonChallenges.sort((a, b) => a - b);
    }

    completedChallenges[lessonId] = lessonChallenges;

    progress.completedChallenges = completedChallenges;
    progress.currentLessonId = lessonId;

    await progress.save();

    const curriculumItems = await getLessonCurriculumItems(
      courseId,
      lessonId
    );

    for (const item of curriculumItems) {
      await activityProgressService.markChallengeComplete(
        userId,
        courseId,
        item._id.toString(),
        challengeIndex
      );
    }

    return progress;
  },
};