import {
  NotificationPreference,
  type NotificationPreferenceDocument,
} from '../models/NotificationPreference.model.js';
import type {
  NotificationPreferenceKey,
  NotificationType,
} from '../models/Notification.model.js';

/**
 * Map every notification type to a preference key.
 *
 * `achievement_unlocked` maps to `null` because it cannot be muted.
 * The type still fires in-app; it just never sends email and never
 * appears in the preferences UI.
 */
const TYPE_TO_PREFERENCE: Record<
  NotificationType,
  NotificationPreferenceKey | null
> = {
  announcement: 'announcements',
  project_feedback: 'projectFeedback',
  resubmission_requested: 'projectFeedback',
  project_submitted: 'submissions',
  team_invitation: 'teamInvites',
  cohort_invitation: 'cohortInvites',
  class_starting_soon: 'classes',
  achievement_unlocked: null,
};

const DEFAULT_PREFERENCES: Record<NotificationPreferenceKey, boolean> = {
  announcements: true,
  projectFeedback: true,
  submissions: true,
  teamInvites: true,
  cohortInvites: true,
  classes: true,
};

export const notificationPreferenceService = {
  async getForUser(
    userId: string,
  ): Promise<Record<NotificationPreferenceKey, boolean>> {
    const row = await NotificationPreference.findOne({ userId }).lean();
    if (!row) return { ...DEFAULT_PREFERENCES };

    return {
      announcements: row.announcements ?? true,
      projectFeedback: row.projectFeedback ?? true,
      submissions: row.submissions ?? true,
      teamInvites: row.teamInvites ?? true,
      cohortInvites: row.cohortInvites ?? true,
      classes: row.classes ?? true,
    };
  },

  async update(
    userId: string,
    patch: Partial<Record<NotificationPreferenceKey, boolean>>,
  ): Promise<Record<NotificationPreferenceKey, boolean>> {
    const update: Partial<NotificationPreferenceDocument> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (typeof value === 'boolean') {
        (update as Record<string, boolean>)[key] = value;
      }
    }

    await NotificationPreference.updateOne(
      { userId },
      { $set: update },
      { upsert: true },
    );

    return this.getForUser(userId);
  },

  async shouldEmail(
    userId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const key = TYPE_TO_PREFERENCE[type];
    if (key === null) return false;

    const prefs = await this.getForUser(userId);
    return prefs[key] ?? true;
  },

  preferenceKeyFor(type: NotificationType): NotificationPreferenceKey | null {
    return TYPE_TO_PREFERENCE[type] ?? null;
  },
};