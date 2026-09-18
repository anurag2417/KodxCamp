import mongoose, { Schema, type Document } from 'mongoose';

export type AchievementCategory =
  | 'learning'
  | 'practice'
  | 'projects'
  | 'classes'
  | 'streak'
  | 'milestones';

export interface IAchievement {
  _id: string;
  key: string;          // stable identifier e.g. 'first_lesson'
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;         // emoji or lucide icon name
  xpReward: number;
  /** Hidden achievements aren't shown until unlocked */
  secret: boolean;
  createdAt: Date;
}

export interface AchievementDocument extends Omit<IAchievement, '_id'>, Document {}

const achievementSchema = new Schema<AchievementDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['learning', 'practice', 'projects', 'classes', 'streak', 'milestones'],
      required: true,
    },
    icon: { type: String, default: '🏆' },
    xpReward: { type: Number, default: 0 },
    secret: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Achievement = mongoose.model<AchievementDocument>(
  'Achievement',
  achievementSchema
);