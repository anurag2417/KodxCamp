import mongoose, { Schema, type Document } from 'mongoose';

export interface ProgressDocument extends Document {
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  currentStepIndex?: number;
  completedSteps?: number[];
  /**
   * Tutorial challenge completion.
   *
   * Keyed by lesson id; value is the sorted list of completed
   * challenge indexes. Absent key and empty array mean the same
   * thing.
   */
  completedChallenges?: Record<string, number[]>;
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
    completedChallenges: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    percentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Progress = mongoose.model<ProgressDocument>(
  'Progress',
  progressSchema
);