import { User } from '../models/User.model.js';
import { CohortMembership } from '../models/CohortMembership.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { Course } from '../models/Course.model.js';
import { Roadmap } from '../models/Roadmap.model.js';
import { Cohort } from '../models/Cohort.model.js';
import { emailService } from './email.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Announcement delivery.
 *
 * Resolves an audience into a recipient list and a display label,
 * then queues emails via `emailService.enqueue`. The queue worker
 * handles rate limiting and retries; this service does not send
 * anything synchronously.
 *
 * The `all` audience does NOT trigger an email blast. Sending to
 * every user in the system is a footgun — one mis-typed announcement
 * could spam thousands of inboxes. `all` is visible in feeds;
 * emailing it requires a deliberate future change. Every other
 * audience sends.
 *
 * Class announcements are visible in feeds but do not fan out to
 * email yet — see the `class` case below.
 */

export type AnnouncementAudience =
  | { kind: 'all' }
  | { kind: 'roadmap'; id: string }
  | { kind: 'course'; id: string }
  | { kind: 'cohort'; id: string }
  | { kind: 'class'; id: string };

interface ResolvedAudience {
  recipientEmails: string[];
  audienceLabel: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

/**
 * Resolve an audience into the recipient email list and the
 * human-readable bits the template needs. Batched queries — a large
 * cohort is 2 queries, not N.
 */
async function resolveAudience(
  audience: AnnouncementAudience,
): Promise<ResolvedAudience> {
  switch (audience.kind) {
    case 'all':
      return { recipientEmails: [], audienceLabel: 'all students' };

    case 'roadmap': {
      const roadmap = await Roadmap.findById(audience.id)
        .select('title slug')
        .lean();
      const enrollments = await StudentEnrollment.find({
        roadmapId: audience.id,
      })
        .select('userId')
        .lean();

      const emails = await emailsForUserIds(
        enrollments.map((e) => e.userId),
      );

      return {
        recipientEmails: emails,
        audienceLabel: roadmap
          ? `the ${roadmap.title} roadmap`
          : 'this roadmap',
        ctaUrl: roadmap ? `/roadmaps/${roadmap.slug}` : undefined,
        ctaLabel: 'Open roadmap',
      };
    }

    case 'course': {
      const course = await Course.findById(audience.id)
        .select('title slug')
        .lean();
      const enrollments = await StudentEnrollment.find({
        courseId: audience.id,
      })
        .select('userId')
        .lean();

      const emails = await emailsForUserIds(
        enrollments.map((e) => e.userId),
      );

      return {
        recipientEmails: emails,
        audienceLabel: course ? `the ${course.title} course` : 'this course',
        ctaUrl: course ? `/courses/${course.slug}` : undefined,
        ctaLabel: 'Open course',
      };
    }

    case 'cohort': {
      const cohort = await Cohort.findById(audience.id)
        .select('name slug')
        .lean();
      const memberships = await CohortMembership.find({
        cohortId: audience.id,
        role: 'student',
      })
        .select('userId')
        .lean();

      const emails = await emailsForUserIds(
        memberships.map((m) => m.userId),
      );

      return {
        recipientEmails: emails,
        audienceLabel: cohort ? `the ${cohort.name} cohort` : 'this cohort',
        // Cohorts don't have a public destination URL. Leave the
        // CTA off — the reader can find the cohort from their
        // dashboard.
      };
    }

    case 'class':
      // Class announcements are visible in feeds but do not fan out
      // to email in this batch. Wiring classes through the cohort
      // and course resolution is a Batch 12 addition.
      return { recipientEmails: [], audienceLabel: 'this class' };

    default: {
      const _exhaustive: never = audience;
      throw new ApiError(
        400,
        `Unknown audience kind: ${(_exhaustive as { kind: string }).kind}`,
      );
    }
  }
}

/**
 * Load emails for a set of user ids. Skips users that no longer
 * exist (deleted accounts). Deduplicates the id list first so a user
 * enrolled in two courses inside the same roadmap doesn't receive
 * the announcement twice.
 */
async function emailsForUserIds(userIds: string[]): Promise<string[]> {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return [];

  const users = await User.find({ _id: { $in: unique } })
    .select('email')
    .lean();

  return users.map((u) => u.email).filter(Boolean);
}

export const announcementDeliveryService = {
  /**
   * Queue delivery for an announcement. Called by
   * `announcementService.create` after the row is written.
   *
   * Does not throw on failure — the announcement is already saved
   * and readable in feeds; email is a bonus channel. Errors are
   * logged and swallowed.
   */
  async deliver(input: {
    announcementId: string;
    title: string;
    body: string;
    authorName: string;
    audience: AnnouncementAudience;
  }): Promise<void> {
    try {
      const resolved = await resolveAudience(input.audience);

      if (resolved.recipientEmails.length === 0) {
        logger.info('Announcement has no email recipients', {
          announcementId: input.announcementId,
          audienceKind: input.audience.kind,
        });
        return;
      }

      const queued = await emailService.enqueue({
        recipients: resolved.recipientEmails,
        template: 'announcement',
        data: {
          authorName: input.authorName,
          audienceLabel: resolved.audienceLabel,
          title: input.title,
          content: input.body,
          ctaUrl: resolved.ctaUrl,
          ctaLabel: resolved.ctaLabel,
        },
        refModel: 'Announcement',
        refId: input.announcementId,
      });

      logger.info('Announcement queued', {
        announcementId: input.announcementId,
        audienceKind: input.audience.kind,
        queued: queued.queued,
      });
    } catch (err) {
      logger.error('Announcement delivery failed', {
        announcementId: input.announcementId,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },
};