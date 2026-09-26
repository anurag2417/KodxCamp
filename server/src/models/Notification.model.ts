import mongoose, { Schema, type Document } from 'mongoose';

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
 * `NotificationType` maps to exactly one category, except
 * `achievement_unlocked`, which maps to `null` (it cannot be muted).
 *
 * The mapping lives in `notificationPreference.service.ts`.
 */
export type NotificationPreferenceKey =
  | 'announcements'
  | 'projectFeedback'
  | 'submissions'
  | 'teamInvites'
  | 'cohortInvites'
  | 'classes';

export interface NotificationDocument extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'announcement',
        'project_submitted',
        'project_feedback',
        'resubmission_requested',
        'team_invitation',
        'cohort_invitation',
        'class_starting_soon',
        'achievement_unlocked',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 2000 },
    link: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: undefined },
    read: { type: Boolean, default: false, required: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index(
  { readAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90,
    partialFilterExpression: { read: true },
  },
);

export const Notification = mongoose.model<NotificationDocument>(
  'Notification',
  notificationSchema,
);