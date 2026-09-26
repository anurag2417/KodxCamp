import mongoose, { Schema, type Document } from 'mongoose';

/**
 * Per-user email preferences.
 *
 * The document is created lazily — a user with no row is treated as
 * "everything on." That means we don't need to backfill preferences
 * for existing users, and a fresh signup doesn't need an extra write
 * on the register path. The absence of a row is a semantic value,
 * not missing data.
 *
 * Note: in-app notifications are not governed by these flags.
 * Muting a category turns off *email* for that category; the bell
 * still shows the notification.
 */
export interface NotificationPreferenceDocument extends Document {
  userId: string;
  announcements: boolean;
  projectFeedback: boolean;
  submissions: boolean;
  teamInvites: boolean;
  cohortInvites: boolean;
  classes: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferenceSchema =
  new Schema<NotificationPreferenceDocument>(
    {
      userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      announcements: { type: Boolean, default: true },
      projectFeedback: { type: Boolean, default: true },
      submissions: { type: Boolean, default: true },
      teamInvites: { type: Boolean, default: true },
      cohortInvites: { type: Boolean, default: true },
      classes: { type: Boolean, default: true },
    },
    { timestamps: true },
  );

export const NotificationPreference =
  mongoose.model<NotificationPreferenceDocument>(
    'NotificationPreference',
    notificationPreferenceSchema,
  );