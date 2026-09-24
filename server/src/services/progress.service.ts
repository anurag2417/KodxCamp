import { Progress } from '../models/Progress.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { activityService } from './activity.service.js';
import { studentEnrollmentService } from './studentEnrollment.service.js';

const XP_PER_LESSON = 25;

export const progressService = {
  async getForCourse(userId: string, courseId: string) {
    const existing = await Progress.findOne({ userId, courseId }).lean();
    if (existing) return existing;

    return {
      _id: null,
      userId,
      courseId,
      completedLessons: [],
      currentLessonId: undefined,
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
      // Log the activity - this triggers the enrollment upsert too.
      await activityService.record({
        userId,
        type: 'lesson_completed',
        refId: lessonId,
        xp: XP_PER_LESSON,
      });

      // Belt-and-suspenders: also ensure the enrollment exists, in
      // case the activity hook is ever bypassed.
      await studentEnrollmentService.ensureEnrollment({
        userId,
        courseId,
        source: 'progress',
      });
    }

    return progress.toObject();
  },
};