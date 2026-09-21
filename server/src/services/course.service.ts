import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Progress } from '../models/Progress.model.js';
import { ApiError } from '../utils/ApiError.js';
import { permissions } from './permissions.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

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
  functionName?: string;
  outputMode?: 'return' | 'print';
  language: string;
  testCases?: { input: string; expectedOutput: string }[];
}

function getUser(req: AuthRequest) {
  const u = req.user!;
  return { _id: u._id.toString(), role: u.role as string };
}

export const courseService = {
  // ─── Public ────────────────────────────────────────

  async listAll() {
    const courses = await Course.find({ published: true })
      .sort({ createdAt: 1 })
      .lean();

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
    const course = await Course.findOne({ slug, published: true }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const lessons = await Lesson.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .select('-solution -testCases -starterCode')
      .lean();

    return { ...course, lessons, totalLessons: lessons.length };
  },

  async getLessonBySlug(courseSlug: string, lessonSlug: string) {
    const course = await Course.findOne({ slug: courseSlug, published: true }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const lesson = await Lesson.findOne({
      courseId: course._id.toString(),
      slug: lessonSlug,
    })
      .select('-solution')
      .lean();
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    const visibleTestCases = (lesson.testCases ?? []).filter(() => true);

    const safeLesson = { ...lesson, testCases: visibleTestCases };

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

  // ─── Instructor-scoped list ────────────────────────

  /**
   * Courses the current user can work on.
   * Admin → all courses (drafts included)
   * Instructor → only courses they're on the team for
   */
  async listForUser(req: AuthRequest) {
    const user = getUser(req);
    if (user.role === 'admin') {
      const all = await Course.find().sort({ createdAt: -1 }).lean();
      const withCounts = await Promise.all(
        all.map(async (c) => ({
          ...c,
          totalLessons: await Lesson.countDocuments({ courseId: c._id.toString() }),
        }))
      );
      return withCounts;
    }

    const mine = await Course.find({
      $or: [{ createdBy: user._id }, { 'members.userId': user._id }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const withCounts = await Promise.all(
      mine.map(async (c) => ({
        ...c,
        totalLessons: await Lesson.countDocuments({ courseId: c._id.toString() }),
      }))
    );
    return withCounts;
  },

  // ─── Instructor/admin: get full course with all lessons ────

  async getFullForEditor(req: AuthRequest, slug: string) {
    const user = getUser(req);
    const course = await Course.findOne({ slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const permissionCourse =
      course as unknown as Parameters<typeof permissions.canAccessCourse>[1];

    if (!permissions.canAccessCourse(user, permissionCourse)) {
      throw new ApiError(403, 'You do not have access to this course');
    }

    const lessons = await Lesson.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .lean();

    // Attach effective permission flags so the client can render accordingly
    const role = permissions.courseRole(user, permissionCourse);

    return {
      ...course,
      lessons,
      myRole: role,
      permissions: {
        canEditContent: permissions.canEditContent(user, permissionCourse),
        canManageCourse: permissions.canManageCourse(user, permissionCourse),
        canManageTeam: permissions.canManageTeam(user, permissionCourse),
        canViewStudents: permissions.canViewStudents(user, permissionCourse),
        canManageClasses: permissions.canManageClasses(user, permissionCourse),
      },
    };
  },

  // ─── Create course ─────────────────────────────────

  async createCourse(req: AuthRequest, input: CourseInput) {
    const user = getUser(req);

    // Only admins create courses
    if (user.role !== 'admin') {
      throw new ApiError(403, 'Only admins can create courses');
    }

    const exists = await Course.findOne({ slug: input.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');

    const created = await Course.create({
      ...input,
      totalLessons: 0,
      createdBy: user._id,
      members: [],
      published: false,
    });

    return created.toObject();
  },

  // ─── Update course ─────────────────────────────────

  async updateCourse(req: AuthRequest, slug: string, patch: Partial<CourseInput>) {
    const user = getUser(req);
    const course = await Course.findOne({ slug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canManageCourse(
        user,
        course as unknown as Parameters<typeof permissions.canManageCourse>[1]
      )
    ) {
      throw new ApiError(403, 'Only the course lead can edit course details');
    }

    if (patch.slug && patch.slug !== slug) {
      const collision = await Course.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

    Object.assign(course, patch);
    await course.save();
    return course.toObject();
  },

  // ─── Publish/unpublish ─────────────────────────────

  async setPublished(req: AuthRequest, slug: string, published: boolean) {
    const user = getUser(req);
    const course = await Course.findOne({ slug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canManageCourse(
        user,
        course as unknown as Parameters<typeof permissions.canManageCourse>[1]
      )
    ) {
      throw new ApiError(403, 'Only the course lead can publish this course');
    }

    course.published = published;
    await course.save();
    return course.toObject();
  },

  // ─── Delete course ─────────────────────────────────

  async deleteCourse(req: AuthRequest, slug: string) {
    const user = getUser(req);
    const course = await Course.findOne({ slug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canManageCourse(
        user,
        course as unknown as Parameters<typeof permissions.canManageCourse>[1]
      )
    ) {
      throw new ApiError(403, 'Only the course lead can delete this course');
    }

    const courseId = course._id.toString();

    await Promise.all([
      Lesson.deleteMany({ courseId }),
      Progress.deleteMany({ courseId }),
      Course.deleteOne({ _id: course._id }),
    ]);

    return { ok: true };
  },

  // ─── Lessons ───────────────────────────────────────

  async createLesson(req: AuthRequest, courseSlug: string, input: LessonInput) {
    const user = getUser(req);
    const course = await Course.findOne({ slug: courseSlug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canEditContent(
        user,
        course as unknown as Parameters<typeof permissions.canEditContent>[1]
      )
    ) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }

    const existing = await Lesson.findOne({
      courseId: course._id.toString(),
      slug: input.slug,
    }).lean();
    if (existing) throw new ApiError(409, 'Lesson slug already exists in this course');

    const created = await Lesson.create({
      ...input,
      courseId: course._id.toString(),
      testCases: input.testCases ?? [],
      functionName: input.functionName ?? 'solve',
      outputMode: input.outputMode ?? 'print',
    });

    const count = await Lesson.countDocuments({ courseId: course._id.toString() });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return created.toObject();
  },

  async updateLesson(
    req: AuthRequest,
    courseSlug: string,
    lessonSlug: string,
    patch: Partial<LessonInput>
  ) {
    const user = getUser(req);
    const course = await Course.findOne({ slug: courseSlug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canEditContent(
        user,
        course as unknown as Parameters<typeof permissions.canEditContent>[1]
      )
    ) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }

    if (patch.slug && patch.slug !== lessonSlug) {
      const collision = await Lesson.findOne({
        courseId: course._id.toString(),
        slug: patch.slug,
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

  async deleteLesson(req: AuthRequest, courseSlug: string, lessonSlug: string) {
    const user = getUser(req);
    const course = await Course.findOne({ slug: courseSlug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canEditContent(
        user,
        course as unknown as Parameters<typeof permissions.canEditContent>[1]
      )
    ) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }

    await Lesson.deleteOne({
      courseId: course._id.toString(),
      slug: lessonSlug,
    });
    const count = await Lesson.countDocuments({ courseId: course._id.toString() });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return { ok: true };
  },

  // ─── Team management ───────────────────────────────

  async listTeam(req: AuthRequest, slug: string) {
    const user = getUser(req);
    const course = await Course.findOne({ slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canAccessCourse(
        user,
        course as unknown as Parameters<typeof permissions.canAccessCourse>[1]
      )
    ) {
      throw new ApiError(403, 'You do not have access to this course');
    }

    return course.members;
  },

  async addTeamMember(
    req: AuthRequest,
    slug: string,
    memberUserId: string,
    role: 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer'
  ) {
    const user = getUser(req);
    const course = await Course.findOne({ slug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canManageTeam(
        user,
        course as unknown as Parameters<typeof permissions.canManageTeam>[1]
      )
    ) {
      throw new ApiError(403, 'Only the course lead can manage the team');
    }

    // Prevent adding the creator (they're already implicit 'lead')
    if (memberUserId === course.createdBy) {
      throw new ApiError(400, 'This user is the course creator (already lead)');
    }

    // Prevent duplicate
    const existing = course.members.find(
      (m) => m.userId === memberUserId
    );
    if (existing) {
      throw new ApiError(409, 'User is already on this team');
    }

    course.members.push({
      userId: memberUserId,
      role,
      addedAt: new Date(),
      addedBy: user._id,
    });
    await course.save();
    return course.members;
  },

  async updateTeamMemberRole(
    req: AuthRequest,
    slug: string,
    memberUserId: string,
    role: 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer'
  ) {
    const user = getUser(req);
    const course = await Course.findOne({ slug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canManageTeam(
        user,
        course as unknown as Parameters<typeof permissions.canManageTeam>[1]
      )
    ) {
      throw new ApiError(403, 'Only the course lead can manage the team');
    }

    const member = course.members.find(
      (m): boolean => m.userId === memberUserId
    );
    if (!member) throw new ApiError(404, 'User is not on this team');

    member.role = role;
    await course.save();
    return course.members;
  },

  async removeTeamMember(req: AuthRequest, slug: string, memberUserId: string) {
    const user = getUser(req);
    const course = await Course.findOne({ slug });
    if (!course) throw new ApiError(404, 'Course not found');

    if (
      !permissions.canManageTeam(
        user,
        course as unknown as Parameters<typeof permissions.canManageTeam>[1]
      )
    ) {
      throw new ApiError(403, 'Only the course lead can manage the team');
    }

    course.members = course.members.filter(
      (m): boolean => m.userId !== memberUserId
    );
    await course.save();
    return course.members;
  },
};