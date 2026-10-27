import { Course } from '../models/Course.model.js';
import { Module } from '../models/Module.model.js';
import { Section } from '../models/Section.model.js';
import {
  CurriculumItem,
  type CurriculumItemType,
} from '../models/CurriculumItem.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Problem } from '../models/Problem.model.js';
import { Project } from '../models/Project.model.js';
import { QuizQuestion } from '../models/QuizQuestion.model.js';
import { Class } from '../models/Class.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { permissions } from './permissions.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

interface SectionCreateInput {
  moduleId: string;
  title: string;
  description?: string;
  order?: number;
  published?: boolean;
}

interface SectionUpdateInput {
  title?: string;
  description?: string;
  published?: boolean;
}

interface CurriculumItemCreateInput {
  sectionId: string;
  type: CurriculumItemType;
  referenceId: string;
  title?: string;
  description?: string;
  order?: number;
  isRequired?: boolean;
  published?: boolean;
  estimatedMinutes?: number;
}

interface CurriculumItemUpdateInput {
  title?: string;
  description?: string;
  isRequired?: boolean;
  published?: boolean;
  estimatedMinutes?: number;
}

function getUser(req: AuthRequest) {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  return {
    _id: req.user._id.toString(),
    role: req.user.role as string,
  };
}

async function resolveCourseAndRole(
  req: AuthRequest,
  courseSlug: string
) {
  const user = getUser(req);

  const course = await Course.findOne({
    slug: courseSlug,
  });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const role = await permissions.resolveEffectiveRole(
    user,
    course._id.toString()
  );

  return {
    course,
    role,
  };
}

async function requireEditAccess(
  req: AuthRequest,
  courseSlug: string
) {
  const { course, role } =
    await resolveCourseAndRole(req, courseSlug);

  if (!permissions.canEditContent(role)) {
    throw new ApiError(
      403,
      'You do not have permission to edit this course'
    );
  }

  return {
    course,
    role,
  };
}

async function assertModuleBelongsToCourse(
  moduleId: string,
  courseId: string
) {
  const module = await Module.findById(moduleId)
    .select('_id courseId')
    .lean();

  if (!module) {
    throw new ApiError(404, 'Module not found');
  }

  if (module.courseId !== courseId) {
    throw new ApiError(
      400,
      'The module does not belong to this course'
    );
  }

  return module;
}

async function assertSectionBelongsToCourse(
  sectionId: string,
  courseId: string
) {
  const section = await Section.findById(sectionId)
    .select('_id courseId moduleId')
    .lean();

  if (!section) {
    throw new ApiError(404, 'Section not found');
  }

  if (section.courseId !== courseId) {
    throw new ApiError(
      400,
      'The section does not belong to this course'
    );
  }

  return section;
}

async function getNextSectionOrder(
  moduleId: string
) {
  const section = await Section.findOne({
    moduleId,
  })
    .sort({
      order: -1,
    })
    .select('order')
    .lean();

  return (section?.order ?? 0) + 1;
}

async function getNextItemOrder(
  sectionId: string
) {
  const item = await CurriculumItem.findOne({
    sectionId,
  })
    .sort({
      order: -1,
    })
    .select('order')
    .lean();

  return (item?.order ?? 0) + 1;
}

async function reorderDocuments(
  documents: Array<{
    order: number;
    save: () => Promise<unknown>;
  }>
) {
  for (let index = 0; index < documents.length; index++) {
    documents[index].order = index + 1 + 10000;
    await documents[index].save();
  }

  for (let index = 0; index < documents.length; index++) {
    documents[index].order = index + 1;
    await documents[index].save();
  }
}

async function normalizeSectionOrders(
  moduleId: string
) {
  const sections = await Section.find({
    moduleId,
  }).sort({
    order: 1,
    createdAt: 1,
  });

  await reorderDocuments(sections);
}

async function normalizeCurriculumItemOrders(
  sectionId: string
) {
  const items = await CurriculumItem.find({
    sectionId,
  }).sort({
    order: 1,
    createdAt: 1,
  });

  await reorderDocuments(items);
}

async function validateActivityReference(
  course: InstanceType<typeof Course>,
  type: CurriculumItemType,
  referenceId: string
) {
  const courseId =
    course._id.toString();

  switch (type) {
    case 'lesson': {
      const lesson = await Lesson.findOne({
        _id: referenceId,
        courseId,
      })
        .select('_id title')
        .lean();

      if (!lesson) {
        throw new ApiError(
          400,
          'Lesson does not belong to this course'
        );
      }

      return {
        title: lesson.title,
      };
    }

    case 'web_theory':
    case 'web_step':
    case 'web_workshop':
    case 'web_lab': {
      if (
        course.learningType !==
        'web-development'
      ) {
        throw new ApiError(
          400,
          'Web development activities can only be added to web-development courses'
        );
      }

      const lesson = await Lesson.findOne({
        _id: referenceId,
        courseId,
      })
        .select(
          '_id title steps tutorialChallenges'
        )
        .lean();

      if (!lesson) {
        throw new ApiError(
          400,
          'Web activity does not belong to this course'
        );
      }

      if (
        type === 'web_step' &&
        (!lesson.steps ||
          lesson.steps.length === 0)
      ) {
        throw new ApiError(
          400,
          'A web_step activity requires a lesson with steps'
        );
      }

      if (
        type === 'web_lab' &&
        (!lesson.steps ||
          lesson.steps.length === 0) &&
        (!lesson.tutorialChallenges ||
          lesson.tutorialChallenges.length === 0)
      ) {
        throw new ApiError(
          400,
          'A web_lab activity requires steps or tutorial challenges'
        );
      }

      return {
        title: lesson.title,
      };
    }

    case 'mcq': {
      const question =
        await QuizQuestion.findOne({
          _id: referenceId,
          courseId,
        })
          .select('_id prompt')
          .lean();

      if (!question) {
        throw new ApiError(
          400,
          'MCQ does not belong to this course'
        );
      }

      return {
        title: question.prompt,
      };
    }

    case 'coding_problem':
    case 'sql_problem': {
      const problem =
        await Problem.findById(
          referenceId
        )
          .select(
            '_id title scope courseId sqlSetup'
          )
          .lean();

      if (!problem) {
        throw new ApiError(
          400,
          'Problem not found'
        );
      }

      if (
        problem.scope === 'course' &&
        problem.courseId !== courseId
      ) {
        throw new ApiError(
          400,
          'The problem does not belong to this course'
        );
      }

      if (
        type === 'sql_problem' &&
        !problem.sqlSetup
      ) {
        throw new ApiError(
          400,
          'The selected problem is not configured as a SQL problem'
        );
      }

      return {
        title: problem.title,
      };
    }

    case 'quiz': {
      const lesson =
        await Lesson.findOne({
          _id: referenceId,
          courseId,
        })
          .select('_id title')
          .lean();

      if (!lesson) {
        throw new ApiError(
          400,
          'Quiz source lesson does not belong to this course'
        );
      }

      const questionCount =
        await QuizQuestion.countDocuments({
          courseId,
          lessonId: referenceId,
        });

      if (questionCount === 0) {
        throw new ApiError(
          400,
          'The selected lesson does not contain quiz questions'
        );
      }

      return {
        title: lesson.title,
      };
    }

    case 'project': {
      if (
        course.learningType !==
        'web-development'
      ) {
        throw new ApiError(
          400,
          'Projects can only be added to web-development courses'
        );
      }

      const project =
        await Project.findById(
          referenceId
        )
          .select('_id title')
          .lean();

      if (!project) {
        throw new ApiError(
          400,
          'Project not found'
        );
      }

      return {
        title: project.title,
      };
    }

    case 'live_class': {
      const liveClass =
        await Class.findById(
          referenceId
        )
          .select(
            '_id title courseId'
          )
          .lean();

      if (!liveClass) {
        throw new ApiError(
          400,
          'Live class not found'
        );
      }

      if (
        !liveClass.courseId
      ) {
        throw new ApiError(
          400,
          'The live class must be assigned to a course before it can be added to the curriculum'
        );
      }

      if (
        liveClass.courseId !==
        courseId
      ) {
        throw new ApiError(
          400,
          'The live class does not belong to this course'
        );
      }

      return {
        title: liveClass.title,
      };
    }

    default: {
      throw new ApiError(
        400,
        `Unsupported curriculum item type: ${type}`
      );
    }
  }
}

async function buildCurriculum(
  courseId: string,
  publishedOnly: boolean
) {
  const sectionFilter: Record<
    string,
    unknown
  > = {
    courseId,
  };

  const itemFilter: Record<
    string,
    unknown
  > = {
    courseId,
  };

  if (publishedOnly) {
    sectionFilter.published = true;
    itemFilter.published = true;
  }

  const [
    modules,
    sections,
    items,
  ] = await Promise.all([
    Module.find({
      courseId,
    })
      .sort({
        order: 1,
      })
      .lean(),

    Section.find(
      sectionFilter
    )
      .sort({
        order: 1,
      })
      .lean(),

    CurriculumItem.find(
      itemFilter
    )
      .sort({
        order: 1,
      })
      .lean(),
  ]);

  const itemsBySection =
    new Map<
      string,
      typeof items
    >();

  for (const item of items) {
    const sectionId =
      item.sectionId;

    const current =
      itemsBySection.get(
        sectionId
      ) ?? [];

    current.push(item);

    itemsBySection.set(
      sectionId,
      current
    );
  }

  const sectionsByModule =
    new Map<
      string,
      typeof sections
    >();

  for (const section of sections) {
    const moduleId =
      section.moduleId;

    const current =
      sectionsByModule.get(
        moduleId
      ) ?? [];

    current.push(section);

    sectionsByModule.set(
      moduleId,
      current
    );
  }

  return modules.map(
    (module) => {
      const moduleId =
        module._id.toString();

      const moduleSections =
        sectionsByModule.get(
          moduleId
        ) ?? [];

      return {
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

        createdAt:
          module.createdAt,

        updatedAt:
          module.updatedAt,

        sections:
          moduleSections.map(
            (section) => {
              const sectionId =
                section._id.toString();

              const sectionItems =
                itemsBySection.get(
                  sectionId
                ) ?? [];

              return {
                _id:
                  sectionId,

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

                createdAt:
                  section.createdAt,

                updatedAt:
                  section.updatedAt,

                items:
                  sectionItems.map(
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

                      createdAt:
                        item.createdAt,

                      updatedAt:
                        item.updatedAt,
                    })
                  ),
              };
            }
          ),
      };
    }
  );
}

export const curriculumService = {
  async getInstructorCurriculum(
    req: AuthRequest,
    courseSlug: string
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
      !permissions.canAccessCourse(
        role
      )
    ) {
      throw new ApiError(
        403,
        'You do not have access to this course'
      );
    }

    const modules =
      await buildCurriculum(
        course._id.toString(),
        false
      );

    return {
      courseId:
        course._id.toString(),

      course: {
        _id:
          course._id.toString(),

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

        published:
          course.published,
      },

      modules,
    };
  },

  async getStudentCurriculum(
    req: AuthRequest,
    courseSlug: string
  ) {
    const user =
      getUser(req);

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

    const role =
      await permissions.resolveEffectiveRole(
        user,
        course._id.toString()
      );

    const isCourseStaff =
      permissions.canAccessCourse(
        role
      );

    if (!isCourseStaff) {
      const enrollment =
        await StudentEnrollment.findOne({
          userId: user._id,
          courseId:
            course._id.toString(),
        })
          .select('_id')
          .lean();

      if (!enrollment) {
        throw new ApiError(
          403,
          'You must be enrolled in this course to access its curriculum'
        );
      }
    }

    const modules =
      await buildCurriculum(
        course._id.toString(),
        true
      );

    return {
      course: {
        _id:
          course._id.toString(),

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
      },

      modules,
    };
  },

  async createSection(
    req: AuthRequest,
    courseSlug: string,
    input: SectionCreateInput
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    const courseId =
      course._id.toString();

    await assertModuleBelongsToCourse(
      input.moduleId,
      courseId
    );

    const order =
      input.order ??
      (await getNextSectionOrder(
        input.moduleId
      ));

    const created =
      await Section.create({
        courseId,
        moduleId:
          input.moduleId,
        title:
          input.title.trim(),
        description:
          input.description?.trim() ||
          undefined,
        order,
        published:
          input.published ??
          false,
      });

    await normalizeSectionOrders(
      input.moduleId
    );

    return created.toObject();
  },

  async updateSection(
    req: AuthRequest,
    courseSlug: string,
    sectionId: string,
    patch: SectionUpdateInput
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    await assertSectionBelongsToCourse(
      sectionId,
      course._id.toString()
    );

    const update: Record<
      string,
      unknown
    > = {};

    if (
      patch.title !==
      undefined
    ) {
      update.title =
        patch.title.trim();
    }

    if (
      patch.description !==
      undefined
    ) {
      update.description =
        patch.description.trim() ||
        undefined;
    }

    if (
      patch.published !==
      undefined
    ) {
      update.published =
        patch.published;
    }

    const updated =
      await Section.findByIdAndUpdate(
        sectionId,
        update,
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!updated) {
      throw new ApiError(
        404,
        'Section not found'
      );
    }

    return updated;
  },

  async deleteSection(
    req: AuthRequest,
    courseSlug: string,
    sectionId: string
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    const section =
      await assertSectionBelongsToCourse(
        sectionId,
        course._id.toString()
      );

    await CurriculumItem.deleteMany({
      sectionId,
    });

    await Section.deleteOne({
      _id: sectionId,
    });

    await normalizeSectionOrders(
      section.moduleId
    );

    return {
      ok: true,
    };
  },

  async reorderSection(
    req: AuthRequest,
    courseSlug: string,
    sectionId: string,
    newOrder: number
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    const section =
      await assertSectionBelongsToCourse(
        sectionId,
        course._id.toString()
      );

    const sections =
      await Section.find({
        moduleId:
          section.moduleId,
      }).sort({
        order: 1,
      });

    const currentIndex =
      sections.findIndex(
        (entry) =>
          entry._id.toString() ===
          sectionId
      );

    if (currentIndex === -1) {
      throw new ApiError(
        404,
        'Section not found'
      );
    }

    const targetIndex =
      Math.max(
        0,
        Math.min(
          newOrder - 1,
          sections.length - 1
        )
      );

    const [
      moved,
    ] = sections.splice(
      currentIndex,
      1
    );

    sections.splice(
      targetIndex,
      0,
      moved
    );

    await reorderDocuments(
      sections
    );

    return Section.findById(
      sectionId
    ).lean();
  },

  async createItem(
    req: AuthRequest,
    courseSlug: string,
    input: CurriculumItemCreateInput
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    const courseId =
      course._id.toString();

    const section =
      await assertSectionBelongsToCourse(
        input.sectionId,
        courseId
      );

    const reference =
      await validateActivityReference(
        course,
        input.type,
        input.referenceId
      );

    const duplicate =
      await CurriculumItem.findOne({
        sectionId:
          input.sectionId,
        referenceId:
          input.referenceId,
      })
        .select('_id')
        .lean();

    if (duplicate) {
      throw new ApiError(
        409,
        'This activity is already present in this section'
      );
    }

    const order =
      input.order ??
      (await getNextItemOrder(
        input.sectionId
      ));

    const created =
      await CurriculumItem.create({
        courseId,

        moduleId:
          section.moduleId,

        sectionId:
          input.sectionId,

        type:
          input.type,

        referenceId:
          input.referenceId,

        title:
          input.title?.trim() ||
          reference.title,

        description:
          input.description?.trim() ||
          undefined,

        order,

        isRequired:
          input.isRequired ??
          true,

        published:
          input.published ??
          false,

        estimatedMinutes:
          input.estimatedMinutes,
      });

    await normalizeCurriculumItemOrders(
      input.sectionId
    );

    return created.toObject();
  },

  async updateItem(
    req: AuthRequest,
    courseSlug: string,
    itemId: string,
    patch: CurriculumItemUpdateInput
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    const item =
      await CurriculumItem.findOne({
        _id: itemId,
        courseId:
          course._id.toString(),
      });

    if (!item) {
      throw new ApiError(
        404,
        'Curriculum item not found'
      );
    }

    if (
      patch.title !==
      undefined
    ) {
      item.title =
        patch.title.trim();
    }

    if (
      patch.description !==
      undefined
    ) {
      item.description =
        patch.description.trim() ||
        undefined;
    }

    if (
      patch.isRequired !==
      undefined
    ) {
      item.isRequired =
        patch.isRequired;
    }

    if (
      patch.published !==
      undefined
    ) {
      item.published =
        patch.published;
    }

    if (
      patch.estimatedMinutes !==
      undefined
    ) {
      item.estimatedMinutes =
        patch.estimatedMinutes;
    }

    await item.save();

    return item.toObject();
  },

  async deleteItem(
    req: AuthRequest,
    courseSlug: string,
    itemId: string
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    const item =
      await CurriculumItem.findOne({
        _id: itemId,
        courseId:
          course._id.toString(),
      })
        .select(
          '_id sectionId'
        )
        .lean();

    if (!item) {
      throw new ApiError(
        404,
        'Curriculum item not found'
      );
    }

    await CurriculumItem.deleteOne({
      _id: itemId,
    });

    await normalizeCurriculumItemOrders(
      item.sectionId
    );

    return {
      ok: true,
    };
  },

  async reorderItem(
    req: AuthRequest,
    courseSlug: string,
    itemId: string,
    newOrder: number
  ) {
    const {
      course,
    } =
      await requireEditAccess(
        req,
        courseSlug
      );

    const item =
      await CurriculumItem.findOne({
        _id: itemId,
        courseId:
          course._id.toString(),
      });

    if (!item) {
      throw new ApiError(
        404,
        'Curriculum item not found'
      );
    }

    const items =
      await CurriculumItem.find({
        sectionId:
          item.sectionId,
      }).sort({
        order: 1,
      });

    const currentIndex =
      items.findIndex(
        (entry) =>
          entry._id.toString() ===
          itemId
      );

    if (currentIndex === -1) {
      throw new ApiError(
        404,
        'Curriculum item not found'
      );
    }

    const targetIndex =
      Math.max(
        0,
        Math.min(
          newOrder - 1,
          items.length - 1
        )
      );

    const [
      moved,
    ] = items.splice(
      currentIndex,
      1
    );

    items.splice(
      targetIndex,
      0,
      moved
    );

    await reorderDocuments(
      items
    );

    return CurriculumItem.findById(
      itemId
    ).lean();
  },
};