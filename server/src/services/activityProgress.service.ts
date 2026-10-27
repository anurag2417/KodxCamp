import { ActivityProgress } from '../models/ActivityProgress.model.js';
import { CurriculumItem } from '../models/CurriculumItem.model.js';
import { Section } from '../models/Section.model.js';
import { Module } from '../models/Module.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';
import { legacyProgressSyncService } from './legacyProgressSync.service.js';

export interface UpdateActivityProgressInput {
  status?:
  | 'not_started'
  | 'in_progress'
  | 'completed';
  score?: number;
  timeSpentSeconds?: number;
  incrementAttempt?: boolean;
}

const WEB_ACTIVITY_TYPES = [
  'lesson',
  'web_theory',
  'web_step',
  'web_workshop',
  'web_lab',
] as const;

function calculatePercentage(
  completed: number,
  total: number
) {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

async function getCurriculumItem(
  courseId: string,
  curriculumItemId: string
) {
  const item = await CurriculumItem.findOne({
    _id: curriculumItemId,
    courseId,
  });

  if (!item) {
    throw new ApiError(
      404,
      'Curriculum item not found in this course'
    );
  }

  return item;
}

async function getRequiredItems(
  courseId: string,
  filter: Record<string, unknown> = {}
) {
  return CurriculumItem.find({
    courseId,
    published: true,
    isRequired: true,
    ...filter,
  })
    .sort({
      order: 1,
    })
    .lean();
}

async function getCompletedItemIds(
  userId: string,
  courseId: string,
  itemIds: string[]
) {
  if (itemIds.length === 0) {
    return new Set<string>();
  }

  const progress = await ActivityProgress.find({
    userId,
    courseId,
    curriculumItemId: {
      $in: itemIds,
    },
    status: 'completed',
  })
    .select('curriculumItemId')
    .lean();

  return new Set<string>(
    progress.map(
      (item: { curriculumItemId: string }) =>
        item.curriculumItemId
    )
  );
}

async function getLessonForActivity(
  courseId: string,
  curriculumItemId: string
) {
  const item = await getCurriculumItem(
    courseId,
    curriculumItemId
  );

  if (
    !WEB_ACTIVITY_TYPES.includes(
      item.type as (typeof WEB_ACTIVITY_TYPES)[number]
    )
  ) {
    throw new ApiError(
      400,
      'This curriculum item does not support activity progress'
    );
  }

  const lesson = await Lesson.findOne({
    _id: item.referenceId,
    courseId,
  }).lean();

  if (!lesson) {
    throw new ApiError(
      404,
      'Referenced lesson not found in this course'
    );
  }

  return {
    item,
    lesson,
  };
}

export const activityProgressService = {
  async getForActivity(
    userId: string,
    courseId: string,
    curriculumItemId: string
  ) {
    await getCurriculumItem(
      courseId,
      curriculumItemId
    );

    const progress =
      await ActivityProgress.findOne({
        userId,
        courseId,
        curriculumItemId,
      }).lean();

    if (!progress) {
      return {
        _id: null,
        userId,
        courseId,
        curriculumItemId,
        status: 'not_started' as const,
        startedAt: undefined,
        completedAt: undefined,
        attempts: 0,
        score: undefined,
        timeSpentSeconds: 0,
        completedStepIndexes: [],
        completedChallengeIndexes: [],
      };
    }

    return progress;
  },

  async getForCourse(
    userId: string,
    courseId: string
  ) {
    const items = await CurriculumItem.find({
      courseId,
    })
      .sort({
        sectionId: 1,
        order: 1,
      })
      .lean();

    if (items.length === 0) {
      return [];
    }

    const itemIds = items.map((item) =>
      item._id.toString()
    );

    return ActivityProgress.find({
      userId,
      courseId,
      curriculumItemId: {
        $in: itemIds,
      },
    })
      .sort({
        updatedAt: -1,
      })
      .lean();
  },

  async startActivity(
    userId: string,
    courseId: string,
    curriculumItemId: string
  ) {
    await getCurriculumItem(
      courseId,
      curriculumItemId
    );

    const now = new Date();

    return ActivityProgress.findOneAndUpdate(
      {
        userId,
        courseId,
        curriculumItemId,
      },
      {
        $set: {
          status: 'in_progress',
          startedAt: now,
        },
        $setOnInsert: {
          attempts: 0,
          timeSpentSeconds: 0,
          completedStepIndexes: [],
          completedChallengeIndexes: [],
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  },

  async completeActivity(
    userId: string,
    courseId: string,
    curriculumItemId: string,
    input?: {
      score?: number;
      timeSpentSeconds?: number;
      incrementAttempt?: boolean;
    }
  ) {
    await getCurriculumItem(
      courseId,
      curriculumItemId
    );

    if (
      input?.score !== undefined &&
      (input.score < 0 || input.score > 100)
    ) {
      throw new ApiError(
        400,
        'score must be between 0 and 100'
      );
    }

    if (
      input?.timeSpentSeconds !== undefined &&
      (!Number.isInteger(
        input.timeSpentSeconds
      ) ||
        input.timeSpentSeconds < 0)
    ) {
      throw new ApiError(
        400,
        'timeSpentSeconds must be a non-negative integer'
      );
    }

    const now = new Date();

    const existing =
      await ActivityProgress.findOne({
        userId,
        courseId,
        curriculumItemId,
      });

    if (!existing) {
      const progress =
        await ActivityProgress.create({
          userId,
          courseId,
          curriculumItemId,
          status: 'completed',
          startedAt: now,
          completedAt: now,
          attempts: input?.incrementAttempt
            ? 1
            : 0,
          score: input?.score,
          timeSpentSeconds:
            input?.timeSpentSeconds ?? 0,
          completedStepIndexes: [],
          completedChallengeIndexes: [],
        });

      await legacyProgressSyncService.syncLessonCompletion(
        userId,
        courseId,
        curriculumItemId
      );

      return progress;
    }

    existing.status = 'completed';
    existing.completedAt =
      existing.completedAt ?? now;

    if (!existing.startedAt) {
      existing.startedAt = now;
    }

    if (input?.score !== undefined) {
      existing.score = input.score;
    }

    if (input?.timeSpentSeconds !== undefined) {
      existing.timeSpentSeconds +=
        input.timeSpentSeconds;
    }

    if (input?.incrementAttempt) {
      existing.attempts += 1;
    }

    await existing.save();

    await legacyProgressSyncService.syncLessonCompletion(
      userId,
      courseId,
      curriculumItemId
    );

    return existing;
  },

  async updateProgress(
    userId: string,
    courseId: string,
    curriculumItemId: string,
    input: UpdateActivityProgressInput
  ) {
    await getCurriculumItem(
      courseId,
      curriculumItemId
    );

    if (
      input.score !== undefined &&
      (input.score < 0 || input.score > 100)
    ) {
      throw new ApiError(
        400,
        'score must be between 0 and 100'
      );
    }

    if (
      input.timeSpentSeconds !== undefined &&
      (!Number.isInteger(
        input.timeSpentSeconds
      ) ||
        input.timeSpentSeconds < 0)
    ) {
      throw new ApiError(
        400,
        'timeSpentSeconds must be a non-negative integer'
      );
    }

    const existing =
      await ActivityProgress.findOne({
        userId,
        courseId,
        curriculumItemId,
      });

    const now = new Date();

    if (!existing) {
      const status =
        input.status ?? 'in_progress';

      return ActivityProgress.create({
        userId,
        courseId,
        curriculumItemId,
        status,
        startedAt:
          status === 'not_started'
            ? undefined
            : now,
        completedAt:
          status === 'completed'
            ? now
            : undefined,
        attempts: input.incrementAttempt
          ? 1
          : 0,
        score: input.score,
        timeSpentSeconds:
          input.timeSpentSeconds ?? 0,
        completedStepIndexes: [],
        completedChallengeIndexes: [],
      });
    }

    if (input.status !== undefined) {
      existing.status = input.status;

      if (
        input.status !== 'not_started' &&
        !existing.startedAt
      ) {
        existing.startedAt = now;
      }

      if (
        input.status === 'completed' &&
        !existing.completedAt
      ) {
        existing.completedAt = now;
      }
    }

    if (input.score !== undefined) {
      existing.score = input.score;
    }

    if (
      input.timeSpentSeconds !== undefined
    ) {
      existing.timeSpentSeconds +=
        input.timeSpentSeconds;
    }

    if (input.incrementAttempt) {
      existing.attempts += 1;
    }

    await existing.save();

    return existing;
  },

  async markStepComplete(
    userId: string,
    courseId: string,
    curriculumItemId: string,
    stepIndex: number
  ) {
    if (
      !Number.isInteger(stepIndex) ||
      stepIndex < 0
    ) {
      throw new ApiError(
        400,
        'stepIndex must be a non-negative integer'
      );
    }

    const { lesson } =
      await getLessonForActivity(
        courseId,
        curriculumItemId
      );

    const totalSteps =
      lesson.steps?.length ?? 0;

    if (totalSteps === 0) {
      throw new ApiError(
        400,
        'This activity has no steps'
      );
    }

    if (stepIndex >= totalSteps) {
      throw new ApiError(
        400,
        `stepIndex ${stepIndex} is out of bounds`
      );
    }

    let progress =
      await ActivityProgress.findOne({
        userId,
        courseId,
        curriculumItemId,
      });

    const now = new Date();

    if (!progress) {
      progress = await ActivityProgress.create({
        userId,
        courseId,
        curriculumItemId,
        status: 'in_progress',
        startedAt: now,
        attempts: 0,
        timeSpentSeconds: 0,
        completedStepIndexes: [],
        completedChallengeIndexes: [],
      });
    }

    const completed = new Set<number>(
      progress.completedStepIndexes ?? []
    );

    if (!completed.has(stepIndex)) {
      for (let i = 0; i < stepIndex; i++) {
        if (!completed.has(i)) {
          throw new ApiError(
            400,
            `Step ${stepIndex} is locked - complete step ${i} first`
          );
        }
      }

      completed.add(stepIndex);
    }

    const sorted: number[] =
      Array.from(completed).sort(
        (a: number, b: number) => a - b
      );

    progress.completedStepIndexes = sorted;

    if (sorted.length === totalSteps) {
      progress.status = 'completed';

      if (!progress.completedAt) {
        progress.completedAt = now;
      }
    } else {
      progress.status = 'in_progress';
    }

    await progress.save();

    if (progress.status === 'completed') {
      await legacyProgressSyncService.syncLessonCompletion(
        userId,
        courseId,
        curriculumItemId
      );
    }

    return progress;
  },

  async markChallengeComplete(
    userId: string,
    courseId: string,
    curriculumItemId: string,
    challengeIndex: number
  ) {
    if (
      !Number.isInteger(
        challengeIndex
      ) ||
      challengeIndex < 0
    ) {
      throw new ApiError(
        400,
        'challengeIndex must be a non-negative integer'
      );
    }

    const { lesson } =
      await getLessonForActivity(
        courseId,
        curriculumItemId
      );

    const totalChallenges =
      lesson.tutorialChallenges?.length ?? 0;

    if (totalChallenges === 0) {
      throw new ApiError(
        400,
        'This activity has no tutorial challenges'
      );
    }

    if (
      challengeIndex >= totalChallenges
    ) {
      throw new ApiError(
        400,
        `challengeIndex ${challengeIndex} is out of bounds`
      );
    }

    let progress =
      await ActivityProgress.findOne({
        userId,
        courseId,
        curriculumItemId,
      });

    const now = new Date();

    if (!progress) {
      progress = await ActivityProgress.create({
        userId,
        courseId,
        curriculumItemId,
        status: 'in_progress',
        startedAt: now,
        attempts: 0,
        timeSpentSeconds: 0,
        completedStepIndexes: [],
        completedChallengeIndexes: [],
      });
    }

    const completed = new Set<number>(
      progress.completedChallengeIndexes ??
      []
    );

    if (!completed.has(challengeIndex)) {
      for (
        let i = 0;
        i < challengeIndex;
        i++
      ) {
        if (!completed.has(i)) {
          throw new ApiError(
            400,
            `Challenge ${challengeIndex} is locked - complete challenge ${i} first`
          );
        }
      }

      completed.add(challengeIndex);
    }

    const sorted: number[] =
      Array.from(completed).sort(
        (a: number, b: number) => a - b
      );

    progress.completedChallengeIndexes =
      sorted;

    progress.status = 'in_progress';

    await progress.save();

    return progress;
  },

  async getSectionProgress(
    userId: string,
    courseId: string,
    sectionId: string
  ) {
    const section = await Section.findOne({
      _id: sectionId,
      courseId,
    }).lean();

    if (!section) {
      throw new ApiError(
        404,
        'Section not found in this course'
      );
    }

    const items = await getRequiredItems(
      courseId,
      {
        sectionId,
      }
    );

    const itemIds = items.map((item) =>
      item._id.toString()
    );

    const completedIds =
      await getCompletedItemIds(
        userId,
        courseId,
        itemIds
      );

    const completed = items.filter(
      (item) =>
        completedIds.has(
          item._id.toString()
        )
    ).length;

    return {
      sectionId,
      totalRequired: items.length,
      completedRequired: completed,
      percentage: calculatePercentage(
        completed,
        items.length
      ),
      completed:
        items.length > 0 &&
        completed === items.length,
    };
  },

  async getModuleProgress(
    userId: string,
    courseId: string,
    moduleId: string
  ) {
    const module = await Module.findOne({
      _id: moduleId,
      courseId,
    }).lean();

    if (!module) {
      throw new ApiError(
        404,
        'Module not found in this course'
      );
    }

    const items = await getRequiredItems(
      courseId,
      {
        moduleId,
      }
    );

    const itemIds = items.map((item) =>
      item._id.toString()
    );

    const completedIds =
      await getCompletedItemIds(
        userId,
        courseId,
        itemIds
      );

    const completed = items.filter(
      (item) =>
        completedIds.has(
          item._id.toString()
        )
    ).length;

    return {
      moduleId,
      totalRequired: items.length,
      completedRequired: completed,
      percentage: calculatePercentage(
        completed,
        items.length
      ),
      completed:
        items.length > 0 &&
        completed === items.length,
    };
  },

  async getCourseProgress(
    userId: string,
    courseId: string
  ) {
    const items =
      await getRequiredItems(courseId);

    const itemIds = items.map((item) =>
      item._id.toString()
    );

    const completedIds =
      await getCompletedItemIds(
        userId,
        courseId,
        itemIds
      );

    const completed = items.filter(
      (item) =>
        completedIds.has(
          item._id.toString()
        )
    ).length;

    return {
      courseId,
      totalRequired: items.length,
      completedRequired: completed,
      percentage: calculatePercentage(
        completed,
        items.length
      ),
      completed:
        items.length > 0 &&
        completed === items.length,
    };
  },
};