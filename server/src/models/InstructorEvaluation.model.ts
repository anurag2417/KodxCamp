import mongoose, { Schema, type Document } from 'mongoose';

export type InstructorEvaluationStatus =
  | 'passed'
  | 'needs_improvement'
  | 'resubmission_requested';

interface CategoryOverride {
  category: string;
  score: number;
  note?: string;
}

export interface InstructorEvaluationDocument extends Document {
  submissionId: string;
  projectId: string;
  instructorId: string;
  revisionNumber: number;

  finalScore: number;
  categoryOverrides: CategoryOverride[];
  feedback: string;
  requestResubmission: boolean;
  status: InstructorEvaluationStatus;

  evaluationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const categoryOverrideSchema = new Schema<CategoryOverride>(
  {
    category: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String },
  },
  { _id: false },
);

const instructorEvaluationSchema = new Schema<InstructorEvaluationDocument>(
  {
    submissionId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    instructorId: { type: String, required: true, index: true },
    revisionNumber: { type: Number, required: true, min: 1 },

    finalScore: { type: Number, required: true, min: 0, max: 100 },
    categoryOverrides: { type: [categoryOverrideSchema], default: [] },
    feedback: { type: String, required: true, maxlength: 10_000 },
    requestResubmission: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ['passed', 'needs_improvement', 'resubmission_requested'],
      required: true,
      index: true,
    },

    evaluationDate: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

/**
 * The natural key: one review per
 * `(submissionId, instructorId, revisionNumber)`.
 *
 * A re-review by the same instructor produces a new
 * `revisionNumber` and therefore a new row. Old revisions survive.
 */
instructorEvaluationSchema.index(
  { submissionId: 1, instructorId: 1, revisionNumber: 1 },
  { unique: true },
);

/**
 * Fast lookup for the review history of a submission, newest first.
 */
instructorEvaluationSchema.index({
  submissionId: 1,
  evaluationDate: -1,
});

/**
 * Fast lookup for a specific instructor's reviews of a submission,
 * used to compute the next revision number.
 */
instructorEvaluationSchema.index({
  submissionId: 1,
  instructorId: 1,
  revisionNumber: -1,
});

export const InstructorEvaluation = mongoose.model<InstructorEvaluationDocument>(
  'InstructorEvaluation',
  instructorEvaluationSchema,
);