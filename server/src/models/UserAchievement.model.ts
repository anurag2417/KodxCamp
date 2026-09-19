import mongoose, { Schema, type Document } from 'mongoose';

export interface IUserAchievement {
  _id: string;
  userId: string;
  achievementKey: string;
  unlockedAt: Date;
}

export interface UserAchievementDocument
  extends Omit<IUserAchievement, '_id'>,
    Document {}

const userAchievementSchema = new Schema<UserAchievementDocument>(
  {
    userId: { type: String, required: true, index: true },
    achievementKey: { type: String, required: true, index: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Unique — prevents duplicate unlocks under concurrency
userAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

export const UserAchievement = mongoose.model<UserAchievementDocument>(
  'UserAchievement',
  userAchievementSchema
);