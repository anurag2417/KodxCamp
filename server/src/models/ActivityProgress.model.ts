import mongoose, {
  Schema,
  type Document,
} from 'mongoose';

export const ACTIVITY_PROGRESS_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
] as const;

export type ActivityProgressStatus =
  (typeof ACTIVITY_PROGRESS_STATUSES)[number];

export interface ActivityProgressDocument
  extends Document {
  userId: string;
  courseId: string;
  curriculumItemId: string;

  status: ActivityProgressStatus;

  startedAt?: Date;
  completedAt?: Date;

  attempts: number;
  score?: number;
  timeSpentSeconds: number;

  completedStepIndexes: number[];
  completedChallengeIndexes: number[];

  createdAt: Date;
  updatedAt: Date;
}

const activityProgressSchema =
  new Schema<ActivityProgressDocument>(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      courseId: {
        type: String,
        required: true,
        index: true,
      },

      curriculumItemId: {
        type: String,
        required: true,
        index: true,
      },

      status: {
        type: String,
        enum: ACTIVITY_PROGRESS_STATUSES,
        required: true,
        default: 'not_started',
        index: true,
      },

      startedAt: {
        type: Date,
        default: undefined,
      },

      completedAt: {
        type: Date,
        default: undefined,
      },

      attempts: {
        type: Number,
        default: 0,
        min: 0,
      },

      score: {
        type: Number,
        min: 0,
        max: 100,
        default: undefined,
      },

      timeSpentSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },

      completedStepIndexes: {
        type: [Number],
        default: [],
      },

      completedChallengeIndexes: {
        type: [Number],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

activityProgressSchema.index(
  {
    userId: 1,
    curriculumItemId: 1,
  },
  {
    unique: true,
  }
);

activityProgressSchema.index({
  userId: 1,
  courseId: 1,
});

activityProgressSchema.index({
  courseId: 1,
  curriculumItemId: 1,
});

export const ActivityProgress =
  mongoose.model<ActivityProgressDocument>(
    'ActivityProgress',
    activityProgressSchema
  );