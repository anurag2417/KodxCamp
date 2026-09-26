/**
 * In-app notifications.
 *
 * Master Spec, section 47:
 *   "Notifications are the platform's way of telling a user that
 *    something they care about has changed."
 *
 * A Notification is a per-user row. One logical event (an
 * announcement posted to a course with 40 students) fans out to 40
 * rows. See the note in `Notification.model.ts` for why the fan-out
 * model beats a shared-inbox model.
 */

/**
 * Every kind of notification the platform raises.
 *
 * The list is closed on purpose. Preferences are keyed by this
 * union, the client renderer switches on it, and the analytics
 * roll-up groups by it. Adding a new notification means adding a
 * variant here — which is exactly the friction we want, because it
 * forces a deliberate decision about the copy, the icon, and the
 * preference category.
 *
 * Note there is no `achievement` preference category in the model:
 * achievement notifications cannot be disabled. They're part of the
 * gamification loop and turning them off in-app would break the
 * tone. See `NotificationPreference.model.ts`.
 */
export type NotificationType =
  | 'announcement'
  | 'project_submitted'
  | 'project_feedback'
  | 'resubmission_requested'
  | 'team_invitation'
  | 'cohort_invitation'
  | 'class_starting_soon'
  | 'achievement_unlocked';

/**
 * The categories a user can mute via email preferences. Every
 * `NotificationType` maps to exactly one category. The `achievement`
 * type has no category because it can't be muted.
 *
 * This is a *sub*-union of the types. The mapping from type to
 * category is in the client and the server; keeping both in sync is
 * a matter of not renaming either.
 */
export type NotificationPreferenceKey =
  | 'announcements'
  | 'projectFeedback'
  | 'submissions'
  | 'teamInvites'
  | 'cohortInvites'
  | 'classes';

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /**
   * Optional deep link the client should navigate to when the user
   * clicks the notification. Relative in-app path (e.g.
   * `/instructor/submissions/abc`), never an external URL.
   */
  link?: string;
  /**
   * Free-form structured data the client can use for type-specific
   * rendering, deep-linking, and analytics. Never rendered directly.
   */
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Per-user email preferences. In-app notifications always fire; this
 * only controls which categories also send email.
 *
 * Default for every key is `true` — a fresh user gets email for
 * everything until they turn it off.
 */
export interface INotificationPreferences {
  announcements: boolean;
  projectFeedback: boolean;
  submissions: boolean;
  teamInvites: boolean;
  cohortInvites: boolean;
  classes: boolean;
}