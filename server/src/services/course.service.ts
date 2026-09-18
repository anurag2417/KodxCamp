import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';

interface CourseInput {
  title: string;
  slug: string;
  description: string;
  language: string;
  thumbnail?: string;
}

interface LessonInput {
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode?: string;
  solution?: string;
  language: string;
  testCases?: { input: string; expectedOutput: string; isHidden: boolean }[];
}

export const courseService = {
  async listAll() {
    const courses = await Course.find().sort({ createdAt: 1 }).lean();
    const withCounts = await Promise.all(
      courses.map(async (c) => {
        const lessonCount = await Lesson.countDocuments({
          courseId: c._id.toString(),
        });
        return { ...c, totalLessons: lessonCount };
      })
    );
    return withCounts;
  },

  async getBySlug(slug: string) {
    const course = await Course.findOne({ slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const lessons = await Lesson.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .select('-solution -testCases')
      .lean();

    return { ...course, lessons, totalLessons: lessons.length };
  },

  async getLessonBySlug(courseSlug: string, lessonSlug: string) {
    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const lesson = await Lesson.findOne({
      courseId: course._id.toString(),
      slug: lessonSlug,
    }).lean();
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    const safeLesson = {
      ...lesson,
      testCases: lesson.testCases.filter((tc) => !tc.isHidden),
    };

    return { course, lesson: safeLesson };
  },

  // ─── Admin: courses ───────────────────────────────
  async createCourse(input: CourseInput) {
    const exists = await Course.findOne({ slug: input.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');
    const created = await Course.create({ ...input, totalLessons: 0 });
    return created.toObject();
  },

  async updateCourse(slug: string, patch: Partial<CourseInput>) {
    const updated = await Course.findOneAndUpdate({ slug }, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new ApiError(404, 'Course not found');
    return updated;
  },

  async deleteCourse(slug: string) {
    const course = await Course.findOne({ slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');
    await Promise.all([
      Lesson.deleteMany({ courseId: course._id.toString() }),
      Course.deleteOne({ _id: course._id }),
    ]);
    return { ok: true };
  },

  // ─── Admin: lessons ───────────────────────────────
  async createLesson(courseSlug: string, input: LessonInput) {
    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const created = await Lesson.create({
      ...input,
      courseId: course._id.toString(),
      testCases: input.testCases ?? [],
    });

    const count = await Lesson.countDocuments({ courseId: course._id.toString() });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return created.toObject();
  },

  async updateLesson(courseSlug: string, lessonSlug: string, patch: Partial<LessonInput>) {
    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const updated = await Lesson.findOneAndUpdate(
      { courseId: course._id.toString(), slug: lessonSlug },
      patch,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new ApiError(404, 'Lesson not found');
    return updated;
  },

  async deleteLesson(courseSlug: string, lessonSlug: string) {
    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    await Lesson.deleteOne({ courseId: course._id.toString(), slug: lessonSlug });
    const count = await Lesson.countDocuments({ courseId: course._id.toString() });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return { ok: true };
  },
};