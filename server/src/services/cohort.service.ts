import { Cohort } from '../models/Cohort.model.js';
import { CohortMembership } from '../models/CohortMembership.model.js';
import { Course } from '../models/Course.model.js';
import { Roadmap } from '../models/Roadmap.model.js';
import { User } from '../models/User.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

type CohortEntityKind = 'course' | 'roadmap';
type CohortRole = 'instructor' | 'assistant' | 'student';

interface CohortInput {
  name: string;
  slug: string;
  description?: string;
  entityKind: CohortEntityKind;
  entityId: string;
  startDate?: string;
  endDate?: string;
  displayOrder?: number;
}

/**
 * The minimal shape `enrichSummaries` needs from a Cohort. Declaring
 * it structurally (instead of as `CohortDocument`) lets both raw
 * documents and `.lean()` results pass through without fighting
 * Mongoose's FlattenMaps<Document> typing.
 */
interface CohortForEnrichment {
  _id: { toString: () => string };
  name: string;
  slug: string;
  description?: string;
  entityKind: CohortEntityKind;
  entityId: string;
  startDate?: string;
  endDate?: string;
  archived: boolean;
  createdAt: Date;
}

async function resolveEntity(
  entityKind: CohortEntityKind,
  entityId: string
): Promise<{
  _id: string;
  title: string;
  slug: string;
  description: string;
  language?: string;
  thumbnail?: string;
} | null> {
  if (entityKind === 'course') {
    const course = await Course.findById(entityId)
      .select('_id title slug description language thumbnail')
      .lean();
    if (!course) return null;
    return {
      _id: course._id.toString(),
      title: course.title,
      slug: course.slug,
      description: course.description,
      language: course.language,
      thumbnail: course.thumbnail,
    };
  }

  const roadmap = await Roadmap.findById(entityId)
    .select('_id title slug description thumbnail')
    .lean();
  if (!roadmap) return null;
  return {
    _id: roadmap._id.toString(),
    title: roadmap.title,
    slug: roadmap.slug,
    description: roadmap.description,
    thumbnail: roadmap.thumbnail,
  };
}

async function enrichSummaries(cohorts: CohortForEnrichment[]) {
  if (cohorts.length === 0) return [];

  const courseIds = cohorts
    .filter((c) => c.entityKind === 'course')
    .map((c) => c.entityId);
  const roadmapIds = cohorts
    .filter((c) => c.entityKind === 'roadmap')
    .map((c) => c.entityId);

  const [courses, roadmaps, membershipCounts] = await Promise.all([
    Course.find({ _id: { $in: courseIds } })
      .select('_id title slug')
      .lean(),
    Roadmap.find({ _id: { $in: roadmapIds } })
      .select('_id title slug')
      .lean(),
    CohortMembership.aggregate<{
      _id: { cohortId: string; role: CohortRole };
      count: number;
    }>([
      {
        $match: {
          cohortId: { $in: cohorts.map((c) => c._id.toString()) },
        },
      },
      {
        $group: {
          _id: { cohortId: '$cohortId', role: '$role' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const courseById = new Map(courses.map((c) => [c._id.toString(), c]));
  const roadmapById = new Map(roadmaps.map((r) => [r._id.toString(), r]));

  const studentCounts = new Map<string, number>();
  const instructorCounts = new Map<string, number>();
  for (const entry of membershipCounts) {
    const id = entry._id.cohortId;
    if (entry._id.role === 'student') {
      studentCounts.set(id, (studentCounts.get(id) ?? 0) + entry.count);
    } else {
      instructorCounts.set(
        id,
        (instructorCounts.get(id) ?? 0) + entry.count
      );
    }
  }

  return cohorts.map((c) => {
    const id = c._id.toString();
    const entity =
      c.entityKind === 'course'
        ? courseById.get(c.entityId)
        : roadmapById.get(c.entityId);

    return {
      _id: id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      entityKind: c.entityKind,
      entityId: c.entityId,
      entityTitle: entity?.title ?? '(deleted)',
      entitySlug: entity?.slug ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      archived: c.archived,
      studentCount: studentCounts.get(id) ?? 0,
      instructorCount: instructorCounts.get(id) ?? 0,
      createdAt: c.createdAt,
    };
  });
}

export const cohortService = {
  async listAll(opts: { includeArchived?: boolean } = {}) {
    const query = opts.includeArchived ? {} : { archived: false };
    const cohorts = await Cohort.find(query)
      .sort({ archived: 1, displayOrder: 1 })
      .lean();
    return enrichSummaries(cohorts);
  },

  async listForUser(userId: string, opts: { includeArchived?: boolean } = {}) {
    const memberships = await CohortMembership.find({
      userId,
      role: { $in: ['instructor', 'assistant'] },
    })
      .select('cohortId')
      .lean();

    const cohortIds = memberships.map((m) => m.cohortId);
    if (cohortIds.length === 0) return [];

    const query: Record<string, unknown> = { _id: { $in: cohortIds } };
    if (!opts.includeArchived) query.archived = false;

    const cohorts = await Cohort.find(query)
      .sort({ archived: 1, displayOrder: 1 })
      .lean();
    return enrichSummaries(cohorts);
  },

  async listForEntity(entityKind: CohortEntityKind, entityId: string) {
    const cohorts = await Cohort.find({
      entityKind,
      entityId,
      archived: false,
    })
      .sort({ displayOrder: 1 })
      .lean();
    return enrichSummaries(cohorts);
  },

  async getById(cohortId: string) {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) throw new ApiError(404, 'Cohort not found');
    return cohort.toObject();
  },

  async getDetail(cohortId: string) {
    const cohort = await Cohort.findById(cohortId).lean();
    if (!cohort) throw new ApiError(404, 'Cohort not found');

    const entity = await resolveEntity(cohort.entityKind, cohort.entityId);

    const memberships = await CohortMembership.find({ cohortId })
      .sort({ addedAt: 1 })
      .lean();

    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email avatar role')
      .lean();
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    const instructors = memberships
      .filter((m) => m.role === 'instructor')
      .map((m) => {
        const u = userById.get(m.userId);
        return {
          _id: m.userId,
          name: u?.name ?? '(unknown)',
          email: u?.email ?? '',
          avatar: u?.avatar,
          role: u?.role ?? 'student',
        };
      });

    const assistants = memberships
      .filter((m) => m.role === 'assistant')
      .map((m) => {
        const u = userById.get(m.userId);
        return {
          _id: m.userId,
          name: u?.name ?? '(unknown)',
          email: u?.email ?? '',
          avatar: u?.avatar,
          role: u?.role ?? 'student',
        };
      });

    const students = memberships
      .filter((m) => m.role === 'student')
      .map((m) => {
        const u = userById.get(m.userId);
        return {
          _id: m.userId,
          name: u?.name ?? '(unknown)',
          email: u?.email ?? '',
          avatar: u?.avatar,
          joinedAt: m.addedAt,
        };
      });

    return {
      cohort: {
        ...cohort,
        _id: cohort._id.toString(),
      },
      entity: entity
        ? { kind: cohort.entityKind, ...entity }
        : {
            kind: cohort.entityKind,
            _id: cohort.entityId,
            title: '(deleted)',
            slug: '',
            description: '',
          },
      instructors,
      assistants,
      students,
    };
  },

  async create(input: CohortInput, createdBy: string) {
    const exists = await Cohort.findOne({ slug: input.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');

    const entity = await resolveEntity(input.entityKind, input.entityId);
    if (!entity) {
      throw new ApiError(
        400,
        `${input.entityKind === 'course' ? 'Course' : 'Roadmap'} not found`
      );
    }

    const created = await Cohort.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      entityKind: input.entityKind,
      entityId: input.entityId,
      startDate: input.startDate,
      endDate: input.endDate,
      displayOrder: input.displayOrder ?? Date.now(),
      archived: false,
      createdBy,
    });

    return created.toObject();
  },

  async update(
    cohortId: string,
    patch: Partial<CohortInput> & { archived?: boolean }
  ) {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) throw new ApiError(404, 'Cohort not found');

    if (patch.slug && patch.slug !== cohort.slug) {
      const collision = await Cohort.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

    if (patch.entityKind && patch.entityId) {
      const entity = await resolveEntity(patch.entityKind, patch.entityId);
      if (!entity) {
        throw new ApiError(400, 'New entity not found');
      }
    }

    Object.assign(cohort, patch);
    await cohort.save();
    return cohort.toObject();
  },

  async setArchived(cohortId: string, archived: boolean) {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) throw new ApiError(404, 'Cohort not found');
    cohort.archived = archived;
    await cohort.save();
    return cohort.toObject();
  },

  async delete(cohortId: string) {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) throw new ApiError(404, 'Cohort not found');

    await Promise.all([
      CohortMembership.deleteMany({ cohortId }),
      StudentEnrollment.updateMany(
        { cohortId },
        { $unset: { cohortId: '' } }
      ),
      Cohort.deleteOne({ _id: cohort._id }),
    ]);

    return { ok: true };
  },

  async addMember(input: {
    cohortId: string;
    userId: string;
    role: CohortRole;
    addedBy: string;
  }) {
    const cohort = await Cohort.findById(input.cohortId).lean();
    if (!cohort) throw new ApiError(404, 'Cohort not found');

    const user = await User.findById(input.userId).select('_id').lean();
    if (!user) throw new ApiError(404, 'User not found');

    const existing = await CohortMembership.findOne({
      userId: input.userId,
      cohortId: input.cohortId,
    }).lean();
    if (existing) {
      throw new ApiError(409, 'User is already a member of this cohort');
    }

    const created = await CohortMembership.create({
      userId: input.userId,
      cohortId: input.cohortId,
      role: input.role,
      addedBy: input.addedBy,
    });

    if (input.role === 'student' && cohort.entityKind === 'course') {
      await StudentEnrollment.updateOne(
        { userId: input.userId, courseId: cohort.entityId },
        {
          $setOnInsert: {
            userId: input.userId,
            courseId: cohort.entityId,
            joinedAt: new Date(),
            source: 'manual',
          },
          $set: { cohortId: input.cohortId },
        },
        { upsert: true }
      );
    }

    // Notify the new member. Only students get this — instructors
    // and assistants are added by admins who already know, and the
    // in-app bell would just echo their own action back at them.
    //
    // Fire-and-forget: the membership row is written; a failed
    // notification is not a reason to fail the add.
    if (input.role === 'student') {
      void (async () => {
        try {
          await notificationService.create({
            userId: input.userId,
            type: 'cohort_invitation',
            title: `You've been added to ${cohort.name}`,
            body: `You are now a member of the "${cohort.name}" cohort.`,
            metadata: { cohortId: input.cohortId },
          });
        } catch (err) {
          logger.warn('Failed to notify cohort member', {
            cohortId: input.cohortId,
            err: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    }

    return created.toObject();
  },

  async updateMemberRole(
    cohortId: string,
    userId: string,
    role: CohortRole
  ) {
    const membership = await CohortMembership.findOne({ cohortId, userId });
    if (!membership) throw new ApiError(404, 'Membership not found');
    membership.role = role;
    await membership.save();
    return membership.toObject();
  },

  async removeMember(cohortId: string, userId: string) {
    const result = await CohortMembership.deleteOne({ cohortId, userId });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Membership not found');
    }

    await StudentEnrollment.updateMany(
      { cohortId, userId },
      { $unset: { cohortId: '' } }
    );

    return { ok: true };
  },

  async instructorCanSeeStudent(
    instructorId: string,
    studentId: string
  ): Promise<boolean> {
    const instructorCohorts = await CohortMembership.find({
      userId: instructorId,
      role: { $in: ['instructor', 'assistant'] },
    })
      .select('cohortId')
      .lean();

    if (instructorCohorts.length === 0) return false;

    const cohortIds = instructorCohorts.map((c) => c.cohortId);
    const shared = await CohortMembership.findOne({
      userId: studentId,
      cohortId: { $in: cohortIds },
      role: 'student',
    }).lean();

    return Boolean(shared);
  },
};