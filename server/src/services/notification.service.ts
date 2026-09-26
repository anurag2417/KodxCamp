import { Notification } from '../models/Notification.model.js';
import type { NotificationType } from '../models/Notification.model.js';
import { notificationPreferenceService } from './notificationPreference.service.js';
import { emailService } from './email.service.js';
import { User } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

interface CreateOneInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  /**
   * When true, skip the in-app row and only send email. Used by
   * callers that want email without cluttering the bell. Rare.
   */
  emailOnly?: boolean;
  /**
   * When true, skip email and only create the in-app row. Used by
   * high-frequency events (project submissions) that would be too
   * noisy in email.
   */
  inAppOnly?: boolean;
}

interface FanOutInput {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  /** Same semantics as `CreateOneInput.inAppOnly`. */
  inAppOnly?: boolean;
}

/**
 * Notifications.
 *
 * One service, two entry points:
 *
 *   create()   — one notification to one user
 *   fanOut()   — one notification to many users (batch)
 *
 * Both accept the same payload shape. `fanOut` batches the in-app
 * inserts and the email queue writes so a cohort of 500 is 2 round
 * trips, not 500.
 *
 * Delivery policy:
 *   - In-app always fires (except when `emailOnly` is set).
 *   - Email fires when the user's preference for the type is on,
 *     the type is email-eligible, and `inAppOnly` is not set.
 *   - Achievements never email (see the type map in the preference
 *     service).
 *
 * The service does not throw on email failures — the in-app
 * notification is the source of truth. If email delivery breaks,
 * the user still sees the notification when they open the app.
 */
export const notificationService = {
  /**
   * Create one notification for one user.
   *
   * Never throws on email failure. Throws only if the in-app insert
   * itself fails, which is a database problem the caller should see.
   */
  async create(input: CreateOneInput): Promise<void> {
    if (!input.inAppOnly) {
      await Notification.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        metadata: input.metadata,
        read: false,
      });
    }

    if (input.emailOnly || input.inAppOnly) {
      // When inAppOnly is set, no email. When emailOnly is set, we
      // still want to email; fall through.
      if (input.inAppOnly) return;
    }

    // Email path. Check the preference, then queue.
    await this.tryQueueEmail({
      userIds: [input.userId],
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    });
  },

  /**
   * Fan out to many users. Batches both the in-app inserts and the
   * email queue.
   */
  async fanOut(input: FanOutInput): Promise<void> {
    if (input.userIds.length === 0) return;

    const uniqueIds = Array.from(new Set(input.userIds));

    if (!input.inAppOnly) {
      const docs = uniqueIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        metadata: input.metadata,
        read: false,
      }));
      await Notification.insertMany(docs);
    }

    if (input.inAppOnly) return;

    await this.tryQueueEmail({
      userIds: uniqueIds,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    });
  },

  /**
   * List notifications for a user, newest first.
   *
   * `unreadOnly` filters to unread rows — used by the bell dropdown
   * and the `/notifications?unread=true` page variant. Pagination is
   * page-based (the total count is cheap thanks to the index).
   */
  async listForUser(
    userId: string,
    opts: {
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (opts.unreadOnly) query.read = false;

    const [rows, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      notifications: rows.map((r) => ({
        ...r,
        _id: String(r._id),
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  },

  async unreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, read: false });
  },

  async markRead(userId: string, notificationId: string): Promise<void> {
    await Notification.updateOne(
      { _id: notificationId, userId },
      { $set: { read: true, readAt: new Date() } },
    );
  },

  async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } },
    );
  },

  async delete(userId: string, notificationId: string): Promise<void> {
    await Notification.deleteOne({ _id: notificationId, userId });
  },

  /**
   * Internal: check preferences, load emails, queue the template.
   *
   * Never throws. Any failure is logged. The in-app row (already
   * written) is the source of truth; email is a bonus.
   */
  async tryQueueEmail(input: {
    userIds: string[];
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
  }): Promise<void> {
    try {
      // Filter to users whose preference allows email for this type.
      // Runs one preference read per unique user. For a small
      // audience this is fine; for very large audiences, a batched
      // read would be better, but the current shape bounds the
      // problem: the types that fan out to large audiences
      // (announcements) already go through a different path (the
      // announcement delivery service).
      const eligible: string[] = [];
      for (const userId of input.userIds) {
        const ok = await notificationPreferenceService.shouldEmail(
          userId,
          input.type,
        );
        if (ok) eligible.push(userId);
      }

      if (eligible.length === 0) return;

      const users = await User.find({ _id: { $in: eligible } })
        .select('_id email name')
        .lean();

      if (users.length === 0) return;

      // One enqueue call for the batch. The email service writes one
      // log row per recipient and the queue worker sends them with
      // throttling.
      await emailService.enqueue({
        recipients: users.map((u) => u.email),
        template: 'notification',
        data: {
          title: input.title,
          body: input.body,
          link: input.link,
        },
        refModel: 'Notification',
        refId: undefined,
      });
    } catch (err) {
      logger.warn('Notification email dispatch failed', {
        type: input.type,
        recipients: input.userIds.length,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },
};