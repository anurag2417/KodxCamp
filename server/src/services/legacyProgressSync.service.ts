import { CurriculumItem } from '../models/CurriculumItem.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Progress } from '../models/Progress.model.js';

export const legacyProgressSyncService = {
  async syncLessonCompletion(
    userId: string,
    courseId: string,
    curriculumItemId: string
  ) {
    const curriculumItem =
      await CurriculumItem.findOne({
        _id: curriculumItemId,
        courseId,
        type: 'lesson',
      })
        .select('referenceId')
        .lean();

    if (!curriculumItem) {
      return null;
    }

    const lessonId = curriculumItem.referenceId;

    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId,
    })
      .select('_id')
      .lean();

    if (!lesson) {
      return null;
    }

    const totalLessons =
      await Lesson.countDocuments({
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

    if (
      !progress.completedLessons.includes(
        lessonId
      )
    ) {
      progress.completedLessons.push(
        lessonId
      );
    }

    progress.percentage =
      totalLessons > 0
        ? Math.round(
            (progress.completedLessons.length /
              totalLessons) *
              100
          )
        : 0;

    progress.currentLessonId = lessonId;
    progress.currentStepIndex = 0;
    progress.completedSteps = [];

    await progress.save();

    return progress;
  },
};