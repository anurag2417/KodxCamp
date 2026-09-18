import mongoose, { Schema, type Document } from 'mongoose';
import type { IUser, UserRole } from '@kodxcamp/shared';

export interface UserDocument extends Omit<IUser, '_id'>, Document {
  lastActiveDay?: string;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'] as UserRole[],
      default: 'student',
    },
    avatar: { type: String },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    lastActiveDay: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', userSchema);