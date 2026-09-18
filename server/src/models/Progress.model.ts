import mongoose, { Schema, type Document } from 'mongoose';
import type { IProgress } from '@kodxcamp/shared';

export interface ProgressDocument extends Omit<IProgress, '_id'>, Document {}

const progressSchema = new Schema<ProgressDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    completedLessons: { type: [String], default: [] },
    currentLessonId: { type: String },
    percentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Progress = mongoose.model<ProgressDocument>('Progress', progressSchema);