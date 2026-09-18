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

interface LessonTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
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
      .select('-solution -testCases -starterCode')
      .lean();

    return { ...course, lessons, totalLessons: lessons.length };
  },

  /**
   * Public lesson fetch — used by students.
   *
   * - Strips `solution` (never ship the answer to the client)
   * - Strips `hidden` test cases (only visible ones are returned)
   * - Returns `course` summary + `lesson` payload
   */
  async getLessonBySlug(courseSlug: string, lessonSlug: string) {
    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const lesson = await Lesson.findOne({
      courseId: course._id.toString(),
      slug: lessonSlug,
    })
      .select('-solution')
      .lean();
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    const visibleTestCases: LessonTestCase[] = (lesson.testCases ?? []).filter(
      (tc: LessonTestCase) => !tc.isHidden
    );

    const safeLesson = {
      ...lesson,
      testCases: visibleTestCases,
    };

    // Only return the fields a student needs — not the whole lesson collection
    const safeCourse = {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      language: course.language,
      thumbnail: course.thumbnail,
      totalLessons: course.totalLessons,
    };

    return { course: safeCourse, lesson: safeLesson };
  },

  // ─── Admin: courses ───────────────────────────────
  async createCourse(input: CourseInput) {
    const exists = await Course.findOne({ slug: input.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');
    const created = await Course.create({ ...input, totalLessons: 0 });
    return created.toObject();
  },

  async updateCourse(slug: string, patch: Partial<CourseInput>) {
    // Prevent renaming to a slug that already exists elsewhere
    if (patch.slug && patch.slug !== slug) {
      const collision = await Course.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

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

    const courseId = course._id.toString();

    // Cascade: lessons + progress records that reference this course
    const { Progress } = await import('../models/Progress.model.js');

    await Promise.all([
      Lesson.deleteMany({ courseId }),
      Progress.deleteMany({ courseId }),
      Course.deleteOne({ _id: course._id }),
    ]);

    return { ok: true };
  },

  // ─── Admin: lessons ───────────────────────────────
  async createLesson(courseSlug: string, input: LessonInput) {
    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    // Reject duplicate slug within the same course
    const existing = await Lesson.findOne({
      courseId: course._id.toString(),
      slug: input.slug,
    }).lean();
    if (existing) throw new ApiError(409, 'Lesson slug already exists in this course');

    const created = await Lesson.create({
      ...input,
      courseId: course._id.toString(),
      testCases: input.testCases ?? [],
    });

    const count = await Lesson.countDocuments({ courseId: course._id.toString() });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return created.toObject();
  },

  async updateLesson(
    courseSlug: string,
    lessonSlug: string,
    patch: Partial<LessonInput>
  ) {
    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    // If renaming the slug, ensure no other lesson in this course has it
    if (patch.slug && patch.slug !== lessonSlug) {
      const collision = await Lesson.findOne({
        courseId: course._id.toString(),
        slug: patch.slug,
        _id: { $ne: undefined },
      }).lean();
      if (collision) {
        throw new ApiError(409, 'Another lesson with this slug already exists');
      }
    }

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

    await Lesson.deleteOne({
      courseId: course._id.toString(),
      slug: lessonSlug,
    });
    const count = await Lesson.countDocuments({ courseId: course._id.toString() });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return { ok: true };
  },
};