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
  courseType?: string;
  thumbnail?: string;
}

interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface WebChecksInput {
  requiredHtml?: string[];
  requiredCss?: string[];
  requiredJs?: string[];
}

interface WebLessonStepInput {
  title: string;
  instructions: string;
  hint?: string;
  starterFiles?: Partial<{
    'index.html': string;
    'styles.css': string;
    'script.js': string;
  }>;
  webChecks?: WebChecksInput;
}

interface LessonInput {
  title: string;
  slug: string;
  order: number;
  content: string;
  contentType?: string;
  starterCode?: string;
  starterFiles?: Record<string, string>;
  webChecks?: WebChecksInput;
  solution?: string;
  problemSlug?: string;
  functionName?: string;
  outputMode?: 'return' | 'print';
  language: string;
  testCases?: TestCaseInput[];
  steps?: WebLessonStepInput[];
}

function getUser(req: AuthRequest) {
  const u = req.user!;
  return { _id: u._id.toString(), role: u.role as string };
}

function normalizeTestCase(tc: TestCaseInput, index: number) {
  if (!tc.expectedOutput) {
    throw new ApiError(
      400,
      `Test case #${index + 1}: expectedOutput is required`
    );
  }
  return {
    input: tc.input ?? '',
    expectedOutput: tc.expectedOutput,
    isHidden: Boolean(tc.isHidden),
  };
}

function normalizeWebChecks(checks?: WebChecksInput) {
  return {
    requiredHtml: checks?.requiredHtml ?? [],
    requiredCss: checks?.requiredCss ?? [],
    requiredJs: checks?.requiredJs ?? [],
  };
}

function normalizeSteps(
  language: string,
  steps: WebLessonStepInput[] | undefined
): Array<{
  title: string;
  instructions: string;
  hint?: string;
  starterFiles: {
    'index.html': string;
    'styles.css': string;
    'script.js': string;
  };
  webChecks: {
    requiredHtml: string[];
    requiredCss: string[];
    requiredJs: string[];
  };
}> {
  if (!steps || steps.length === 0) return [];
  if (!['html-css', 'react', 'tailwind'].includes(language)) {
    return [];
  }

  return steps.map((step, i) => {
    if (!step.title || step.title.trim().length === 0) {
      throw new ApiError(400, `Step #${i + 1}: title is required`);
    }
    if (!step.instructions || step.instructions.trim().length === 0) {
      throw new ApiError(400, `Step #${i + 1}: instructions are required`);
    }
    return {
      title: step.title.trim(),
      instructions: step.instructions,
      hint: step.hint,
      starterFiles: {
        'index.html': step.starterFiles?.['index.html'] ?? '',
        'styles.css': step.starterFiles?.['styles.css'] ?? '',
        'script.js': step.starterFiles?.['script.js'] ?? '',
      },
      webChecks: normalizeWebChecks(step.webChecks),
    };
  });
}

function normalizeStarterFiles(
  language: string,
  files?: Record<string, string>
): Record<string, string> | undefined {
  if (!['html-css', 'react', 'tailwind'].includes(language)) return files;
  return {
    'index.html': files?.['index.html'] ?? '',
    'styles.css': files?.['styles.css'] ?? '',
    'script.js': files?.['script.js'] ?? '',
  };
}

export const courseService = {
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
      .select('-solution -testCases -starterCode -steps')
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

    const testCases = (lesson.testCases ?? []).map((tc, i) => ({
      index: i,
      input: tc.input ?? '',
      expectedOutput: tc.expectedOutput ?? '',
      isHidden: Boolean(tc.isHidden),
    }));

    const safeLesson = {
      ...lesson,
      testCases,
      steps: lesson.steps ?? [],
    };

    const siblingLessons = await Lesson.find({
      courseId: course._id.toString(),
    })
      .sort({ order: 1 })
      .select('_id title slug order language problemSlug')
      .lean();

    const safeCourse = {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      language: course.language,
      thumbnail: course.thumbnail,
      totalLessons: siblingLessons.length,
      lessons: siblingLessons,
    };

    return { course: safeCourse, lesson: safeLesson };
  },

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

    const role = permissions.courseRole(user, permissionCourse);

    return {
      ...course,
      lessons: lessons.map((l) => ({
        ...l,
        steps: l.steps ?? [],
      })),
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

  async createCourse(req: AuthRequest, input: CourseInput) {
    const user = getUser(req);

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

    const testCases = (input.testCases ?? []).map((tc, i) =>
      normalizeTestCase(tc, i)
    );

    const steps = normalizeSteps(input.language, input.steps);

    const created = await Lesson.create({
      ...input,
      courseId: course._id.toString(),
      starterFiles: normalizeStarterFiles(course.language, input.starterFiles),
      webChecks: normalizeWebChecks(input.webChecks),
      testCases,
      steps,
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

    const update: Record<string, unknown> = { ...patch };

    if (patch.starterFiles || patch.language) {
      update.starterFiles = normalizeStarterFiles(
        patch.language ?? course.language,
        patch.starterFiles
      );
    }

    if (patch.webChecks) {
      update.webChecks = normalizeWebChecks(patch.webChecks);
    }

    if (patch.testCases) {
      update.testCases = patch.testCases.map((tc, i) =>
        normalizeTestCase(tc, i)
      );
    }

    if (patch.steps) {
      update.steps = normalizeSteps(
        patch.language ?? course.language,
        patch.steps
      );
    }

    const updated = await Lesson.findOneAndUpdate(
      { courseId: course._id.toString(), slug: lessonSlug },
      update,
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

    if (memberUserId === course.createdBy) {
      throw new ApiError(400, 'This user is the course creator (already lead)');
    }

    const existing = course.members.find((m) => m.userId === memberUserId);
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

    const member = course.members.find((m) => m.userId === memberUserId);
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

    course.members = course.members.filter((m) => m.userId !== memberUserId);
    await course.save();
    return course.members;
  },
};