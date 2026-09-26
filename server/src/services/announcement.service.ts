import { Announcement } from '../models/Announcement.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { announcementDeliveryService } from './announcementDelivery.service.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { CohortMembership } from '../models/CohortMembership.model.js';

export type AnnouncementAudience =
  | { kind: 'all' }
  | { kind: 'roadmap'; id: string }
  | { kind: 'course'; id: string }
  | { kind: 'cohort'; id: string }
  | { kind: 'class'; id: string };

interface CreateInput {
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  pinnedUntil?: Date;
}

export const announcementService = {
  async create(input: CreateInput) {
    const audienceKind = input.audience.kind;
    const audienceId =
      input.audience.kind === 'all' ? undefined : input.audience.id;

    const created = await Announcement.create({
      title: input.title,
      body: input.body,
      audienceKind,
      audienceId,
      authorId: input.authorId,
      publishedAt: new Date(),
      pinnedUntil: input.pinnedUntil,
    });

    // Email delivery (fire-and-forget, delivery service catches its
    // own errors).
    void announcementDeliveryService.deliver({
      announcementId: String(created._id),
      title: input.title,
      body: input.body,
      authorName: input.authorName,
      audience: input.audience,
    });

    // In-app notifications. For announcements, the audience resolver
    // is different from the email path (email is queue-based; the
    // in-app path needs user ids). We resolve once here so both
    // consumers agree on who the audience is.
    void (async () => {
      try {
        const userIds = await resolveAudienceUserIds(input.audience);
        if (userIds.length === 0) return;

        await notificationService.fanOut({
          userIds,
          type: 'announcement',
          title: input.title,
          body: input.body,
          link: announcementLink(input.audience),
          metadata: {
            announcementId: String(created._id),
            audienceKind,
            audienceId,
          },
          inAppOnly: true,
        });

        logger.info('Announcement notifications fanned out', {
          announcementId: String(created._id),
          recipients: userIds.length,
        });
      } catch (err) {
        logger.error('Announcement notification fan-out failed', {
          announcementId: String(created._id),
          err: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    logger.info('Announcement created', {
      announcementId: String(created._id),
      audienceKind,
      authorId: input.authorId,
    });

    return created.toObject();
  },

  async listForUser(
    _userId: string,
    opts: { audienceIds: { kind: string; id: string }[] },
  ) {
    const audienceClauses: Record<string, unknown>[] = [
      { audienceKind: 'all' },
    ];

    for (const { kind, id } of opts.audienceIds) {
      audienceClauses.push({ audienceKind: kind, audienceId: id });
    }

    const rows = await Announcement.find({ $or: audienceClauses })
      .sort({ pinnedUntil: -1, publishedAt: -1 })
      .limit(50)
      .lean();

    if (rows.length === 0) return [];

    const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
    const authors = await User.find({ _id: { $in: authorIds } })
      .select('_id name avatar')
      .lean();
    const authorById = new Map(authors.map((u) => [String(u._id), u]));

    return rows.map((r) => ({
      ...r,
      _id: String(r._id),
      author: {
        _id: r.authorId,
        name: authorById.get(r.authorId)?.name ?? '(unknown)',
        avatar: authorById.get(r.authorId)?.avatar,
      },
    }));
  },

  async listByAuthor(authorId: string) {
    const rows = await Announcement.find({ authorId })
      .sort({ publishedAt: -1 })
      .limit(100)
      .lean();

    return rows.map((r) => ({
      ...r,
      _id: String(r._id),
    }));
  },

  async delete(announcementId: string) {
    const result = await Announcement.deleteOne({ _id: announcementId });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Announcement not found');
    }
    return { ok: true };
  },
};

/**
 * Resolve the audience to a list of user ids. Batched.
 *
 * `all` returns an empty list — a platform-wide announcement
 * doesn't fan out to in-app notifications for the same reason it
 * doesn't email everyone: unbounded work per click.
 */
async function resolveAudienceUserIds(
  audience: AnnouncementAudience,
): Promise<string[]> {
  switch (audience.kind) {
    case 'all':
      return [];

    case 'roadmap': {
      const enrollments = await StudentEnrollment.find({
        roadmapId: audience.id,
      })
        .select('userId')
        .lean();
      return Array.from(new Set(enrollments.map((e) => e.userId)));
    }

    case 'course': {
      const enrollments = await StudentEnrollment.find({
        courseId: audience.id,
      })
        .select('userId')
        .lean();
      return Array.from(new Set(enrollments.map((e) => e.userId)));
    }

    case 'cohort': {
      const memberships = await CohortMembership.find({
        cohortId: audience.id,
        role: 'student',
      })
        .select('userId')
        .lean();
      return Array.from(new Set(memberships.map((m) => m.userId)));
    }

    case 'class':
      // Class announcements don't fan out to in-app. The class
      // itself has its own reminder flow.
      return [];
  }
}

/**
 * A deep link for the announcement. Only course and roadmap have
 * natural in-app destinations.
 */
function announcementLink(audience: AnnouncementAudience): string | undefined {
  switch (audience.kind) {
    case 'course':
      return `/courses/${audience.id}`;
    case 'roadmap':
      return `/roadmaps/${audience.id}`;
    default:
      return undefined;
  }
}