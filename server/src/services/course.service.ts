import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Module } from '../models/Module.model.js';
import { Progress } from '../models/Progress.model.js';
import { CourseMembership } from '../models/CourseMembership.model.js';
import { ApiError } from '../utils/ApiError.js';
import { permissions } from './permissions.service.js';
import { courseMembershipService } from './courseMembership.service.js';
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

interface ChallengeCheckInput {
  type: 'includes' | 'dom';
  value?: string;
  selector?: string;
  expect?: 'exists' | 'textEquals' | 'textMatches';
  label?: string;
}

interface TutorialChallengeInput {
  title: string;
  instructions: string;
  hint?: string;
  starterCode?: string;
  checks: ChallengeCheckInput[];
  language?: string;
}

interface LessonInput {
  title: string;
  slug: string;
  order: number;
  content: string;
  contentType?: string;
  moduleId?: string;
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
  tutorialChallenges?: TutorialChallengeInput[];
}

function getUser(req: AuthRequest) {
  const u = req.user!;
  return { _id: u._id.toString(), role: u.role as string };
}

async function resolveCourseAndRole(
  req: AuthRequest,
  slug: string
): Promise<{
  course: InstanceType<typeof Course>;
  role: Awaited<ReturnType<typeof permissions.resolveEffectiveRole>>;
}> {
  const user = getUser(req);
  const course = await Course.findOne({ slug });
  if (!course) throw new ApiError(404, 'Course not found');
  const role = await permissions.resolveEffectiveRole(
    user,
    course._id.toString()
  );
  return { course, role };
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

/**
 * Normalize a tutorial-challenge check. Throws on structural errors
 * so the author gets a clear message at save time, not at student
 * runtime.
 */
function normalizeChallengeCheck(
  check: ChallengeCheckInput,
  challengeIndex: number,
  checkIndex: number
): ChallengeCheckInput {
  const label = `Challenge #${challengeIndex + 1}, check #${checkIndex + 1}`;

  if (check.type === 'includes') {
    if (!check.value || check.value.length === 0) {
      throw new ApiError(400, `${label}: "value" is required for includes`);
    }
    return {
      type: 'includes',
      value: check.value,
      label: check.label,
    };
  }

  if (check.type === 'dom') {
    if (!check.selector || check.selector.length === 0) {
      throw new ApiError(400, `${label}: "selector" is required for dom`);
    }
    if (!check.expect) {
      throw new ApiError(400, `${label}: "expect" is required for dom`);
    }
    if (
      check.expect !== 'exists' &&
      (!check.value || check.value.length === 0)
    ) {
      throw new ApiError(
        400,
        `${label}: "value" is required for dom with expect "${check.expect}"`
      );
    }
    return {
      type: 'dom',
      selector: check.selector,
      expect: check.expect,
      value: check.value,
      label: check.label,
    };
  }

  throw new ApiError(400, `${label}: unknown check type`);
}

function normalizeTutorialChallenges(
  challenges: TutorialChallengeInput[] | undefined
): Array<{
  title: string;
  instructions: string;
  hint?: string;
  starterCode: string;
  checks: ChallengeCheckInput[];
  language: string;
}> {
  if (!challenges || challenges.length === 0) return [];

  return challenges.map((c, i) => {
    if (!c.title || c.title.trim().length === 0) {
      throw new ApiError(400, `Challenge #${i + 1}: title is required`);
    }
    if (!c.instructions || c.instructions.trim().length === 0) {
      throw new ApiError(400, `Challenge #${i + 1}: instructions are required`);
    }
    if (!c.checks || c.checks.length === 0) {
      throw new ApiError(
        400,
        `Challenge #${i + 1}: at least one check is required`
      );
    }
    return {
      title: c.title.trim(),
      instructions: c.instructions,
      hint: c.hint,
      starterCode: c.starterCode ?? '',
      checks: c.checks.map((check, j) =>
        normalizeChallengeCheck(check, i, j)
      ),
      language: c.language ?? 'html',
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

async function assertModuleBelongsToCourse(
  moduleId: string | undefined,
  courseId: string
): Promise<void> {
  if (!moduleId) return;
  const mod = await Module.findById(moduleId).select('courseId').lean();
  if (!mod) throw new ApiError(400, 'Module not found');
  if (mod.courseId !== courseId) {
    throw new ApiError(
      400,
      'The module belongs to a different course than the lesson.'
    );
  }
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
      tutorialChallenges: lesson.tutorialChallenges ?? [],
    };

    const [siblingLessons, modules] = await Promise.all([
      Lesson.find({ courseId: course._id.toString() })
        .sort({ order: 1 })
        .select('_id title slug order language problemSlug moduleId')
        .lean(),
      Module.find({ courseId: course._id.toString() })
        .sort({ order: 1 })
        .lean(),
    ]);

    const safeCourse = {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      language: course.language,
      thumbnail: course.thumbnail,
      price: course.price,
      isFree: course.isFree,
      totalLessons: siblingLessons.length,
      lessons: siblingLessons,
      modules: modules.map((m) => ({
        _id: m._id.toString(),
        courseId: m.courseId,
        title: m.title,
        description: m.description,
        order: m.order,
      })),
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

    const memberships = await CourseMembership.find({ userId: user._id })
      .select('courseId')
      .lean();
    const memberCourseIds = memberships.map((m) => m.courseId);

    const mine = await Course.find({
      $or: [
        { createdBy: user._id },
        { _id: { $in: memberCourseIds } },
      ],
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
    const { course, role } = await resolveCourseAndRole(req, slug);

    if (!permissions.canAccessCourse(role)) {
      throw new ApiError(403, 'You do not have access to this course');
    }

    const [lessons, modules, members] = await Promise.all([
      Lesson.find({ courseId: course._id.toString() })
        .sort({ order: 1 })
        .lean(),
      Module.find({ courseId: course._id.toString() })
        .sort({ order: 1 })
        .lean(),
      courseMembershipService.listForCourse(course._id.toString()),
    ]);

    const courseObj = course.toObject();

    return {
      ...courseObj,
      lessons: lessons.map((l) => ({
        ...l,
        steps: l.steps ?? [],
        tutorialChallenges: l.tutorialChallenges ?? [],
      })),
      modules: modules.map((m) => ({
        _id: m._id.toString(),
        courseId: m.courseId,
        title: m.title,
        description: m.description,
        order: m.order,
      })),
      members,
      myRole: role,
      permissions: {
        canEditContent: permissions.canEditContent(role),
        canManageCourse: permissions.canManageCourse(role),
        canManageTeam: permissions.canManageTeam(role),
        canViewStudents: permissions.canViewStudents(role),
        canManageClasses: permissions.canManageClasses(role),
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
      published: false,
      isFree: true,
    });

    await courseMembershipService.upsert({
      userId: user._id,
      courseId: created._id.toString(),
      role: 'lead',
      addedBy: user._id,
    });

    return created.toObject();
  },

  async updateCourse(req: AuthRequest, slug: string, patch: Partial<CourseInput>) {
    const { course, role } = await resolveCourseAndRole(req, slug);

    if (!permissions.canManageCourse(role)) {
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
    const { course, role } = await resolveCourseAndRole(req, slug);

    if (!permissions.canManageCourse(role)) {
      throw new ApiError(403, 'Only the course lead can publish this course');
    }

    course.published = published;
    await course.save();
    return course.toObject();
  },

  async deleteCourse(req: AuthRequest, slug: string) {
    const { course, role } = await resolveCourseAndRole(req, slug);

    if (!permissions.canManageCourse(role)) {
      throw new ApiError(403, 'Only the course lead can delete this course');
    }

    const courseId = course._id.toString();

    await Promise.all([
      Lesson.deleteMany({ courseId }),
      Module.deleteMany({ courseId }),
      Progress.deleteMany({ courseId }),
      CourseMembership.deleteMany({ courseId }),
      Course.deleteOne({ _id: course._id }),
    ]);

    return { ok: true };
  },

  async createLesson(req: AuthRequest, courseSlug: string, input: LessonInput) {
    const { course, role } = await resolveCourseAndRole(req, courseSlug);

    if (!permissions.canEditContent(role)) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }

    const courseId = course._id.toString();

    if (input.moduleId) {
      await assertModuleBelongsToCourse(input.moduleId, courseId);
    }

    const existing = await Lesson.findOne({
      courseId,
      slug: input.slug,
    }).lean();
    if (existing) throw new ApiError(409, 'Lesson slug already exists in this course');

    const testCases = (input.testCases ?? []).map((tc, i) =>
      normalizeTestCase(tc, i)
    );

    const steps = normalizeSteps(input.language, input.steps);
    const tutorialChallenges = normalizeTutorialChallenges(
      input.tutorialChallenges
    );

    const created = await Lesson.create({
      ...input,
      courseId,
      starterFiles: normalizeStarterFiles(course.language, input.starterFiles),
      webChecks: normalizeWebChecks(input.webChecks),
      testCases,
      steps,
      tutorialChallenges,
      functionName: input.functionName ?? 'solve',
      outputMode: input.outputMode ?? 'print',
    });

    const count = await Lesson.countDocuments({ courseId });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return created.toObject();
  },

  async updateLesson(
    req: AuthRequest,
    courseSlug: string,
    lessonSlug: string,
    patch: Partial<LessonInput>
  ) {
    const { course, role } = await resolveCourseAndRole(req, courseSlug);

    if (!permissions.canEditContent(role)) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }

    const courseId = course._id.toString();

    if (patch.moduleId !== undefined) {
      await assertModuleBelongsToCourse(patch.moduleId, courseId);
    }

    if (patch.slug && patch.slug !== lessonSlug) {
      const collision = await Lesson.findOne({
        courseId,
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

    if (patch.tutorialChallenges) {
      update.tutorialChallenges = normalizeTutorialChallenges(
        patch.tutorialChallenges
      );
    }

    const updated = await Lesson.findOneAndUpdate(
      { courseId, slug: lessonSlug },
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new ApiError(404, 'Lesson not found');
    return updated;
  },

  async deleteLesson(req: AuthRequest, courseSlug: string, lessonSlug: string) {
    const { course, role } = await resolveCourseAndRole(req, courseSlug);

    if (!permissions.canEditContent(role)) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }

    const courseId = course._id.toString();

    await Lesson.deleteOne({
      courseId,
      slug: lessonSlug,
    });
    const count = await Lesson.countDocuments({ courseId });
    await Course.updateOne({ _id: course._id }, { totalLessons: count });

    return { ok: true };
  },

  async listTeam(req: AuthRequest, slug: string) {
    const { course, role } = await resolveCourseAndRole(req, slug);

    if (!permissions.canAccessCourse(role)) {
      throw new ApiError(403, 'You do not have access to this course');
    }

    return courseMembershipService.listForCourse(course._id.toString());
  },

  async addTeamMember(
    req: AuthRequest,
    slug: string,
    memberUserId: string,
    role: 'lead' | 'course_author' | 'problem_author' | 'class_coordinator' | 'ta' | 'viewer'
  ) {
    const { course, role: callerRole } = await resolveCourseAndRole(req, slug);

    if (!permissions.canManageTeam(callerRole)) {
      throw new ApiError(403, 'Only the course lead can manage the team');
    }

    if (memberUserId === course.createdBy) {
      throw new ApiError(400, 'This user is the course creator (already lead)');
    }

    const existing = await CourseMembership.findOne({
      userId: memberUserId,
      courseId: course._id.toString(),
    }).lean();
    if (existing) {
      throw new ApiError(409, 'User is already on this team');
    }

    const user = getUser(req);
    await courseMembershipService.upsert({
      userId: memberUserId,
      courseId: course._id.toString(),
      role,
      addedBy: user._id,
    });

    return courseMembershipService.listForCourse(course._id.toString());
  },

  async updateTeamMemberRole(
    req: AuthRequest,
    slug: string,
    memberUserId: string,
    role: 'lead' | 'course_author' | 'problem_author' | 'class_coordinator' | 'ta' | 'viewer'
  ) {
    const { course, role: callerRole } = await resolveCourseAndRole(req, slug);

    if (!permissions.canManageTeam(callerRole)) {
      throw new ApiError(403, 'Only the course lead can manage the team');
    }

    const member = await CourseMembership.findOne({
      userId: memberUserId,
      courseId: course._id.toString(),
    });
    if (!member) throw new ApiError(404, 'User is not on this team');

    const user = getUser(req);
    await courseMembershipService.upsert({
      userId: memberUserId,
      courseId: course._id.toString(),
      role,
      addedBy: user._id,
    });

    return courseMembershipService.listForCourse(course._id.toString());
  },

  async removeTeamMember(req: AuthRequest, slug: string, memberUserId: string) {
    const { course, role: callerRole } = await resolveCourseAndRole(req, slug);

    if (!permissions.canManageTeam(callerRole)) {
      throw new ApiError(403, 'Only the course lead can manage the team');
    }

    await courseMembershipService.remove(memberUserId, course._id.toString());

    return courseMembershipService.listForCourse(course._id.toString());
  },
};