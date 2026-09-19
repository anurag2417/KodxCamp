import mongoose, { Schema, type Document } from 'mongoose';
export interface ProgressDocument extends Document {
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  percentage: number;
}

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