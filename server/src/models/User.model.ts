import mongoose, { Schema, type Document } from 'mongoose';
type UserRole = 'student' | 'instructor' | 'admin';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  xp: number;
  streak: number;
  lastActiveAt: Date;
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