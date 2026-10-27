import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Module } from '../models/Module.model.js';
import { Section } from '../models/Section.model.js';
import { CurriculumItem } from '../models/CurriculumItem.model.js';
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
  learningType?: 'programming' | 'web-development';
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
  if (!req.user) {
    throw new ApiError(
      401,
      'Authentication required'
    );
  }

  return {
    _id: req.user._id.toString(),
    role: req.user.role as string,
  };
}

async function resolveCourseAndRole(
  req: AuthRequest,
  slug: string
): Promise<{
  course: InstanceType<typeof Course>;
  role: Awaited<
    ReturnType<
      typeof permissions.resolveEffectiveRole
    >
  >;
}> {
  const user = getUser(req);

  const course =
    await Course.findOne({
      slug,
    });

  if (!course) {
    throw new ApiError(
      404,
      'Course not found'
    );
  }

  const role =
    await permissions.resolveEffectiveRole(
      user,
      course._id.toString()
    );

  return {
    course,
    role,
  };
}

function normalizeTestCase(
  tc: TestCaseInput,
  index: number
) {
  if (!tc.expectedOutput) {
    throw new ApiError(
      400,
      `Test case #${index + 1}: expectedOutput is required`
    );
  }

  return {
    input: tc.input ?? '',
    expectedOutput:
      tc.expectedOutput,
    isHidden: Boolean(
      tc.isHidden
    ),
  };
}

function normalizeWebChecks(
  checks?: WebChecksInput
) {
  return {
    requiredHtml:
      checks?.requiredHtml ?? [],

    requiredCss:
      checks?.requiredCss ?? [],

    requiredJs:
      checks?.requiredJs ?? [],
  };
}

function normalizeSteps(
  language: string,
  steps:
    | WebLessonStepInput[]
    | undefined
) {
  if (
    !steps ||
    steps.length === 0
  ) {
    return [];
  }

  if (
    ![
      'html-css',
      'react',
      'tailwind',
    ].includes(language)
  ) {
    return [];
  }

  return steps.map(
    (step, index) => {
      if (
        !step.title ||
        step.title.trim()
          .length === 0
      ) {
        throw new ApiError(
          400,
          `Step #${index + 1}: title is required`
        );
      }

      if (
        !step.instructions ||
        step.instructions
          .trim()
          .length === 0
      ) {
        throw new ApiError(
          400,
          `Step #${index + 1}: instructions are required`
        );
      }

      return {
        title:
          step.title.trim(),

        instructions:
          step.instructions,

        hint:
          step.hint,

        starterFiles: {
          'index.html':
            step.starterFiles?.[
              'index.html'
            ] ?? '',

          'styles.css':
            step.starterFiles?.[
              'styles.css'
            ] ?? '',

          'script.js':
            step.starterFiles?.[
              'script.js'
            ] ?? '',
        },

        webChecks:
          normalizeWebChecks(
            step.webChecks
          ),
      };
    }
  );
}

function normalizeChallengeCheck(
  check: ChallengeCheckInput,
  challengeIndex: number,
  checkIndex: number
) {
  const label =
    `Challenge #${challengeIndex + 1}, check #${checkIndex + 1}`;

  if (
    check.type ===
    'includes'
  ) {
    if (
      !check.value ||
      check.value.length === 0
    ) {
      throw new ApiError(
        400,
        `${label}: "value" is required for includes`
      );
    }

    return {
      type: 'includes' as const,
      value: check.value,
      label: check.label,
    };
  }

  if (
    check.type === 'dom'
  ) {
    if (
      !check.selector ||
      check.selector.length === 0
    ) {
      throw new ApiError(
        400,
        `${label}: "selector" is required for dom`
      );
    }

    if (!check.expect) {
      throw new ApiError(
        400,
        `${label}: "expect" is required for dom`
      );
    }

    if (
      check.expect !== 'exists' &&
      (!check.value ||
        check.value.length === 0)
    ) {
      throw new ApiError(
        400,
        `${label}: "value" is required for dom with expect "${check.expect}"`
      );
    }

    return {
      type: 'dom' as const,
      selector:
        check.selector,
      expect:
        check.expect,
      value:
        check.value,
      label:
        check.label,
    };
  }

  throw new ApiError(
    400,
    `${label}: unknown check type`
  );
}

function normalizeTutorialChallenges(
  challenges:
    | TutorialChallengeInput[]
    | undefined
) {
  if (
    !challenges ||
    challenges.length === 0
  ) {
    return [];
  }

  return challenges.map(
    (challenge, index) => {
      if (
        !challenge.title ||
        challenge.title
          .trim()
          .length === 0
      ) {
        throw new ApiError(
          400,
          `Challenge #${index + 1}: title is required`
        );
      }

      if (
        !challenge.instructions ||
        challenge.instructions
          .trim()
          .length === 0
      ) {
        throw new ApiError(
          400,
          `Challenge #${index + 1}: instructions are required`
        );
      }

      if (
        !challenge.checks ||
        challenge.checks.length ===
          0
      ) {
        throw new ApiError(
          400,
          `Challenge #${index + 1}: at least one check is required`
        );
      }

      return {
        title:
          challenge.title.trim(),

        instructions:
          challenge.instructions,

        hint:
          challenge.hint,

        starterCode:
          challenge.starterCode ??
          '',

        checks:
          challenge.checks.map(
            (
              check,
              checkIndex
            ) =>
              normalizeChallengeCheck(
                check,
                index,
                checkIndex
              )
          ),

        language:
          challenge.language ??
          'html',
      };
    }
  );
}

function normalizeStarterFiles(
  language: string,
  files?: Record<
    string,
    string
  >
) {
  if (
    ![
      'html-css',
      'react',
      'tailwind',
    ].includes(language)
  ) {
    return files;
  }

  return {
    'index.html':
      files?.[
        'index.html'
      ] ?? '',

    'styles.css':
      files?.[
        'styles.css'
      ] ?? '',

    'script.js':
      files?.[
        'script.js'
      ] ?? '',
  };
}

async function assertModuleBelongsToCourse(
  moduleId:
    | string
    | undefined,
  courseId: string
) {
  if (!moduleId) {
    return;
  }

  const module =
    await Module.findById(
      moduleId
    )
      .select(
        'courseId'
      )
      .lean();

  if (!module) {
    throw new ApiError(
      400,
      'Module not found'
    );
  }

  if (
    module.courseId !==
    courseId
  ) {
    throw new ApiError(
      400,
      'The module belongs to a different course than the lesson.'
    );
  }
}

export const courseService = {
  async listAll() {
    const courses =
      await Course.find({
        published: true,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    const withCounts =
      await Promise.all(
        courses.map(
          async (course) => {
            const lessonCount =
              await Lesson.countDocuments(
                {
                  courseId:
                    course._id.toString(),
                }
              );

            return {
              ...course,
              totalLessons:
                lessonCount,
            };
          }
        )
      );

    return withCounts;
  },

  async getBySlug(
    slug: string
  ) {
    const course =
      await Course.findOne({
        slug,
        published: true,
      }).lean();

    if (!course) {
      throw new ApiError(
        404,
        'Course not found'
      );
    }

    const lessons =
      await Lesson.find({
        courseId:
          course._id.toString(),
      })
        .sort({
          order: 1,
        })
        .select(
          '-solution -testCases -starterCode -steps'
        )
        .lean();

    const curriculumItems =
      await CurriculumItem.find({
        courseId:
          course._id.toString(),
        type: 'lesson',
        referenceId: {
          $in: lessons.map((item) => item._id.toString()),
        },
      })
        .select('_id referenceId')
        .lean();

    const curriculumItemByLessonId = new Map(
      curriculumItems.map((item) => [
        item.referenceId,
        item._id.toString(),
      ])
    );

    const safeLessons = lessons.map((lesson) => ({
      ...lesson,
      curriculumItemId:
        curriculumItemByLessonId.get(lesson._id.toString()),
    }));

    return {
      ...course,
      lessons: safeLessons,
      totalLessons:
        safeLessons.length,
    };
  },

  async getLessonBySlug(
    courseSlug: string,
    lessonSlug: string
  ) {
    const course =
      await Course.findOne({
        slug: courseSlug,
        published: true,
      }).lean();

    if (!course) {
      throw new ApiError(
        404,
        'Course not found'
      );
    }

    const lesson =
      await Lesson.findOne({
        courseId:
          course._id.toString(),
        slug: lessonSlug,
      })
        .select(
          '-solution'
        )
        .lean();

    if (!lesson) {
      throw new ApiError(
        404,
        'Lesson not found'
      );
    }

    const testCases =
      (
        lesson.testCases ??
        []
      ).map(
        (testCase, index) => ({
          index,
          input:
            testCase.input ??
            '',
          expectedOutput:
            testCase.expectedOutput ??
            '',
          isHidden:
            Boolean(
              testCase.isHidden
            ),
        })
      );

    const lessonCurriculumItem =
      await CurriculumItem.findOne({
        courseId:
          course._id.toString(),
        type: 'lesson',
        referenceId:
          lesson._id.toString(),
      })
        .select('_id')
        .lean();

    const safeLesson = {
      ...lesson,
      curriculumItemId:
        lessonCurriculumItem?._id.toString(),
      testCases,
      steps:
        lesson.steps ?? [],
      tutorialChallenges:
        lesson.tutorialChallenges ??
        [],
    };

    const [
      siblingLessons,
      modules,
      siblingCurriculumItems,
    ] =
      await Promise.all([
        Lesson.find({
          courseId:
            course._id.toString(),
        })
          .sort({
            order: 1,
        })
          .select(
            '_id title slug order language problemSlug moduleId'
          )
          .lean(),

        Module.find({
          courseId:
            course._id.toString(),
        })
          .sort({
            order: 1,
          })
          .lean(),

        CurriculumItem.find({
          courseId:
            course._id.toString(),
          type: 'lesson',
        })
          .select('_id referenceId')
          .lean(),
      ]);

    const curriculumItemByLessonId = new Map(
      siblingCurriculumItems.map((item) => [
        item.referenceId,
        item._id.toString(),
      ])
    );

    const safeSiblingLessons = siblingLessons.map((lesson) => ({
      ...lesson,
      curriculumItemId:
        curriculumItemByLessonId.get(lesson._id.toString()),
    }));

    const safeCourse = {
      _id:
        course._id,

      title:
        course.title,

      slug:
        course.slug,

      description:
        course.description,

      language:
        course.language,

      learningType:
        course.learningType,

      thumbnail:
        course.thumbnail,

      price:
        course.price,

      isFree:
        course.isFree,

      totalLessons:
        safeSiblingLessons.length,

      lessons:
        safeSiblingLessons,

      modules:
        modules.map(
          (module) => ({
            _id:
              module._id.toString(),

            courseId:
              module.courseId,

            title:
              module.title,

            description:
              module.description,

            order:
              module.order,
          })
        ),
    };

    return {
      course:
        safeCourse,
      lesson:
        safeLesson,
    };
  },

  async listForUser(
    req: AuthRequest
  ) {
    const user =
      getUser(req);

    if (
      user.role === 'admin'
    ) {
      const all =
        await Course.find()
          .sort({
            createdAt: -1,
          })
          .lean();

      return Promise.all(
        all.map(
          async (course) => ({
            ...course,
            totalLessons:
              await Lesson.countDocuments(
                {
                  courseId:
                    course._id.toString(),
                }
              ),
          })
        )
      );
    }

    const memberships =
      await CourseMembership.find({
        userId:
          user._id,
      })
        .select(
          'courseId'
        )
        .lean();

    const memberCourseIds =
      memberships.map(
        (membership) =>
          membership.courseId
      );

    const mine =
      await Course.find({
        $or: [
          {
            createdBy:
              user._id,
          },
          {
            _id: {
              $in:
                memberCourseIds,
            },
          },
        ],
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return Promise.all(
      mine.map(
        async (course) => ({
          ...course,
          totalLessons:
            await Lesson.countDocuments(
              {
                courseId:
                  course._id.toString(),
              }
            ),
        })
      )
    );
  },

  async getFullForEditor(
    req: AuthRequest,
    slug: string
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canAccessCourse(
        role
      )
    ) {
      throw new ApiError(
        403,
        'You do not have access to this course'
      );
    }

    const [
      lessons,
      modules,
      members,
      sections,
      curriculumItems,
    ] =
      await Promise.all([
        Lesson.find({
          courseId:
            course._id.toString(),
        })
          .sort({
            order: 1,
          })
          .lean(),

        Module.find({
          courseId:
            course._id.toString(),
        })
          .sort({
            order: 1,
          })
          .lean(),

        courseMembershipService.listForCourse(
          course._id.toString()
        ),

        Section.find({
          courseId:
            course._id.toString(),
        })
          .sort({
            order: 1,
          })
          .lean(),

        CurriculumItem.find({
          courseId:
            course._id.toString(),
        })
          .sort({
            order: 1,
          })
          .lean(),
      ]);

    const courseObj =
      course.toObject();

    return {
      ...courseObj,

      lessons:
        lessons.map(
          (lesson) => ({
            ...lesson,
            steps:
              lesson.steps ??
              [],
            tutorialChallenges:
              lesson.tutorialChallenges ??
              [],
          })
        ),

      modules:
        modules.map(
          (module) => ({
            _id:
              module._id.toString(),

            courseId:
              module.courseId,

            title:
              module.title,

            description:
              module.description,

            order:
              module.order,
          })
        ),

      sections:
        sections.map(
          (section) => ({
            _id:
              section._id.toString(),

            courseId:
              section.courseId,

            moduleId:
              section.moduleId,

            title:
              section.title,

            description:
              section.description,

            order:
              section.order,

            published:
              section.published,
          })
        ),

      curriculumItems:
        curriculumItems.map(
          (item) => ({
            _id:
              item._id.toString(),

            courseId:
              item.courseId,

            moduleId:
              item.moduleId,

            sectionId:
              item.sectionId,

            type:
              item.type,

            referenceId:
              item.referenceId,

            title:
              item.title,

            description:
              item.description,

            order:
              item.order,

            isRequired:
              item.isRequired,

            published:
              item.published,

            estimatedMinutes:
              item.estimatedMinutes,
          })
        ),

      members,

      myRole:
        role,

      permissions: {
        canEditContent:
          permissions.canEditContent(
            role
          ),

        canManageCourse:
          permissions.canManageCourse(
            role
          ),

        canManageTeam:
          permissions.canManageTeam(
            role
          ),

        canViewStudents:
          permissions.canViewStudents(
            role
          ),

        canManageClasses:
          permissions.canManageClasses(
            role
          ),
      },
    };
  },

  async createCourse(
    req: AuthRequest,
    input: CourseInput
  ) {
    const user =
      getUser(req);

    if (
      user.role !== 'admin'
    ) {
      throw new ApiError(
        403,
        'Only admins can create courses'
      );
    }

    const exists =
      await Course.findOne({
        slug:
          input.slug,
      }).lean();

    if (exists) {
      throw new ApiError(
        409,
        'Slug already exists'
      );
    }

    const created =
      await Course.create({
        title:
          input.title,

        slug:
          input.slug,

        description:
          input.description,

        language:
          input.language,

        learningType:
          input.learningType ??
          'programming',

        courseType:
          input.courseType ??
          'general',

        thumbnail:
          input.thumbnail,

        totalLessons: 0,

        createdBy:
          user._id,

        published: false,

        isFree: true,
      });

    await courseMembershipService.upsert({
      userId:
        user._id,

      courseId:
        created._id.toString(),

      role:
        'lead',

      addedBy:
        user._id,
    });

    return created.toObject();
  },

  async updateCourse(
    req: AuthRequest,
    slug: string,
    patch: Partial<CourseInput>
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canManageCourse(
        role
      )
    ) {
      throw new ApiError(
        403,
        'Only the course lead can edit course details'
      );
    }

    if (
      patch.slug &&
      patch.slug !== slug
    ) {
      const collision =
        await Course.findOne({
          slug:
            patch.slug,
        }).lean();

      if (collision) {
        throw new ApiError(
          409,
          'Slug already exists'
        );
      }
    }

    if (
      patch.learningType &&
      ![
        'programming',
        'web-development',
      ].includes(
        patch.learningType
      )
    ) {
      throw new ApiError(
        400,
        'Invalid course learning type'
      );
    }

    if (
      patch.learningType ===
        'programming' &&
      course.learningType ===
        'web-development'
    ) {
      const projectItems =
        await CurriculumItem.countDocuments(
          {
            courseId:
              course._id.toString(),

            type:
              'project',
          }
        );

      if (
        projectItems > 0
      ) {
        throw new ApiError(
          400,
          'A course containing project activities cannot be changed from web-development to programming'
        );
      }
    }

    Object.assign(
      course,
      patch
    );

    await course.save();

    return course.toObject();
  },

  async setPublished(
    req: AuthRequest,
    slug: string,
    published: boolean
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canManageCourse(
        role
      )
    ) {
      throw new ApiError(
        403,
        'Only the course lead can publish this course'
      );
    }

    course.published =
      published;

    await course.save();

    return course.toObject();
  },

  async deleteCourse(
    req: AuthRequest,
    slug: string
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canManageCourse(
        role
      )
    ) {
      throw new ApiError(
        403,
        'Only the course lead can delete this course'
      );
    }

    const courseId =
      course._id.toString();

    await Promise.all([
      CurriculumItem.deleteMany({
        courseId,
      }),

      Section.deleteMany({
        courseId,
      }),

      Lesson.deleteMany({
        courseId,
      }),

      Module.deleteMany({
        courseId,
      }),

      Progress.deleteMany({
        courseId,
      }),

      CourseMembership.deleteMany({
        courseId,
      }),

      Course.deleteOne({
        _id:
          course._id,
      }),
    ]);

    return {
      ok: true,
    };
  },

  async createLesson(
    req: AuthRequest,
    courseSlug: string,
    input: LessonInput
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        courseSlug
      );

    if (
      !permissions.canEditContent(
        role
      )
    ) {
      throw new ApiError(
        403,
        'You do not have permission to edit this course'
      );
    }

    const courseId =
      course._id.toString();

    if (input.moduleId) {
      await assertModuleBelongsToCourse(
        input.moduleId,
        courseId
      );
    }

    const existing =
      await Lesson.findOne({
        courseId,
        slug:
          input.slug,
      }).lean();

    if (existing) {
      throw new ApiError(
        409,
        'Lesson slug already exists in this course'
      );
    }

    const testCases =
      (
        input.testCases ??
        []
      ).map(
        (testCase, index) =>
          normalizeTestCase(
            testCase,
            index
          )
      );

    const steps =
      normalizeSteps(
        input.language,
        input.steps
      );

    const tutorialChallenges =
      normalizeTutorialChallenges(
        input.tutorialChallenges
      );

    const created =
      await Lesson.create({
        ...input,

        courseId,

        starterFiles:
          normalizeStarterFiles(
            course.language,
            input.starterFiles
          ),

        webChecks:
          normalizeWebChecks(
            input.webChecks
          ),

        testCases,

        steps,

        tutorialChallenges,

        functionName:
          input.functionName ??
          'solve',

        outputMode:
          input.outputMode ??
          'print',
      });

    const count =
      await Lesson.countDocuments({
        courseId,
      });

    await Course.updateOne(
      {
        _id:
          course._id,
      },
      {
        totalLessons:
          count,
      }
    );

    return created.toObject();
  },

  async updateLesson(
    req: AuthRequest,
    courseSlug: string,
    lessonSlug: string,
    patch: Partial<LessonInput>
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        courseSlug
      );

    if (
      !permissions.canEditContent(
        role
      )
    ) {
      throw new ApiError(
        403,
        'You do not have permission to edit this course'
      );
    }

    const courseId =
      course._id.toString();

    if (
      patch.moduleId !==
      undefined
    ) {
      await assertModuleBelongsToCourse(
        patch.moduleId,
        courseId
      );
    }

    if (
      patch.slug &&
      patch.slug !==
        lessonSlug
    ) {
      const collision =
        await Lesson.findOne({
          courseId,
          slug:
            patch.slug,
        }).lean();

      if (collision) {
        throw new ApiError(
          409,
          'Another lesson with this slug already exists'
        );
      }
    }

    const update: Record<
      string,
      unknown
    > = {
      ...patch,
    };

    if (
      patch.starterFiles ||
      patch.language
    ) {
      update.starterFiles =
        normalizeStarterFiles(
          patch.language ??
            course.language,
          patch.starterFiles
        );
    }

    if (
      patch.webChecks
    ) {
      update.webChecks =
        normalizeWebChecks(
          patch.webChecks
        );
    }

    if (
      patch.testCases
    ) {
      update.testCases =
        patch.testCases.map(
          (
            testCase,
            index
          ) =>
            normalizeTestCase(
              testCase,
              index
            )
        );
    }

    if (
      patch.steps
    ) {
      update.steps =
        normalizeSteps(
          patch.language ??
            course.language,
          patch.steps
        );
    }

    if (
      patch.tutorialChallenges
    ) {
      update.tutorialChallenges =
        normalizeTutorialChallenges(
          patch.tutorialChallenges
        );
    }

    const updated =
      await Lesson.findOneAndUpdate(
        {
          courseId,
          slug:
            lessonSlug,
        },
        update,
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!updated) {
      throw new ApiError(
        404,
        'Lesson not found'
      );
    }

    return updated;
  },

  async deleteLesson(
    req: AuthRequest,
    courseSlug: string,
    lessonSlug: string
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        courseSlug
      );

    if (
      !permissions.canEditContent(
        role
      )
    ) {
      throw new ApiError(
        403,
        'You do not have permission to edit this course'
      );
    }

    const courseId =
      course._id.toString();

    const lesson =
      await Lesson.findOne({
        courseId,
        slug:
          lessonSlug,
      })
        .select('_id')
        .lean();

    if (!lesson) {
      throw new ApiError(
        404,
        'Lesson not found'
      );
    }

    await CurriculumItem.deleteMany({
      courseId,
      referenceId:
        lesson._id.toString(),
    });

    await Lesson.deleteOne({
      _id:
        lesson._id,
    });

    const count =
      await Lesson.countDocuments({
        courseId,
      });

    await Course.updateOne(
      {
        _id:
          course._id,
      },
      {
        totalLessons:
          count,
      }
    );

    return {
      ok: true,
    };
  },

  async listTeam(
    req: AuthRequest,
    slug: string
  ) {
    const {
      course,
      role,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canAccessCourse(
        role
      )
    ) {
      throw new ApiError(
        403,
        'You do not have access to this course'
      );
    }

    return courseMembershipService.listForCourse(
      course._id.toString()
    );
  },

  async addTeamMember(
    req: AuthRequest,
    slug: string,
    memberUserId: string,
    role:
      | 'lead'
      | 'course_author'
      | 'problem_author'
      | 'class_coordinator'
      | 'ta'
      | 'viewer'
  ) {
    const {
      course,
      role:
        callerRole,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canManageTeam(
        callerRole
      )
    ) {
      throw new ApiError(
        403,
        'Only the course lead can manage the team'
      );
    }

    if (
      memberUserId ===
      course.createdBy
    ) {
      throw new ApiError(
        400,
        'This user is the course creator (already lead)'
      );
    }

    const existing =
      await CourseMembership.findOne({
        userId:
          memberUserId,

        courseId:
          course._id.toString(),
      }).lean();

    if (existing) {
      throw new ApiError(
        409,
        'User is already on this team'
      );
    }

    const user =
      getUser(req);

    await courseMembershipService.upsert({
      userId:
        memberUserId,

      courseId:
        course._id.toString(),

      role,

      addedBy:
        user._id,
    });

    return courseMembershipService.listForCourse(
      course._id.toString()
    );
  },

  async updateTeamMemberRole(
    req: AuthRequest,
    slug: string,
    memberUserId: string,
    role:
      | 'lead'
      | 'course_author'
      | 'problem_author'
      | 'class_coordinator'
      | 'ta'
      | 'viewer'
  ) {
    const {
      course,
      role:
        callerRole,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canManageTeam(
        callerRole
      )
    ) {
      throw new ApiError(
        403,
        'Only the course lead can manage the team'
      );
    }

    const member =
      await CourseMembership.findOne({
        userId:
          memberUserId,

        courseId:
          course._id.toString(),
      });

    if (!member) {
      throw new ApiError(
        404,
        'User is not on this team'
      );
    }

    const user =
      getUser(req);

    await courseMembershipService.upsert({
      userId:
        memberUserId,

      courseId:
        course._id.toString(),

      role,

      addedBy:
        user._id,
    });

    return courseMembershipService.listForCourse(
      course._id.toString()
    );
  },

  async removeTeamMember(
    req: AuthRequest,
    slug: string,
    memberUserId: string
  ) {
    const {
      course,
      role:
        callerRole,
    } =
      await resolveCourseAndRole(
        req,
        slug
      );

    if (
      !permissions.canManageTeam(
        callerRole
      )
    ) {
      throw new ApiError(
        403,
        'Only the course lead can manage the team'
      );
    }

    await courseMembershipService.remove(
      memberUserId,
      course._id.toString()
    );

    return courseMembershipService.listForCourse(
      course._id.toString()
    );
  },
};