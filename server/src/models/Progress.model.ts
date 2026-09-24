import mongoose, { Schema, type Document } from 'mongoose';

export interface ProgressDocument extends Document {
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  /**
   * Web-lesson step tracking.
   *
   * Only meaningful for lessons with a non-empty `steps` array.
   * Missing values on existing documents MUST be treated as the
   * defaults by every read path - there is no backfill migration.
   */
  currentStepIndex?: number;
  completedSteps?: number[];
  percentage: number;
}

const progressSchema = new Schema<ProgressDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    completedLessons: { type: [String], default: [] },
    currentLessonId: { type: String },
    currentStepIndex: { type: Number, default: 0 },
    completedSteps: { type: [Number], default: [] },
    percentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Progress = mongoose.model<ProgressDocument>(
  'Progress',
  progressSchema
);