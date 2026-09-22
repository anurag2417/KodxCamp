import mongoose, { Schema, type Document } from 'mongoose';

export type ActivityType =
  | 'lesson_completed'
  | 'problem_solved'
  | 'problem_attempted'
  | 'project_saved'
  | 'project_completed'
  | 'class_attended'
  | 'recording_watched'
  | 'achievement_unlocked'
  | 'login';

export interface IActivity {
  _id: string;
  userId: string;
  type: ActivityType;
  refId?: string;
  xp: number;
  day: string;
  createdAt: Date;
}

export interface ActivityDocument extends Omit<IActivity, '_id'>, Document {}

const activitySchema = new Schema<ActivityDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'lesson_completed',
        'problem_solved',
        'problem_attempted',
        'project_saved',
        'project_completed',
        'class_attended',
        'recording_watched',
        'achievement_unlocked',
        'login',
      ],
      required: true,
      index: true,
    },
    refId: { type: String, index: true },
    xp: { type: Number, default: 0 },
    day: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ userId: 1, day: -1 });
activitySchema.index({ userId: 1, type: 1, refId: 1 });

export const Activity = mongoose.model<ActivityDocument>(
  'Activity',
  activitySchema
);