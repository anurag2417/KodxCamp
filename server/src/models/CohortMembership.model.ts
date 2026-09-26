import mongoose, { Schema, type Document } from 'mongoose';

export type CohortRole = 'instructor' | 'assistant' | 'student';

export interface CohortMembershipDocument extends Document {
  userId: string;
  cohortId: string;
  role: CohortRole;
  addedAt: Date;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const cohortMembershipSchema = new Schema<CohortMembershipDocument>(
  {
    userId: { type: String, required: true, index: true },
    cohortId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['instructor', 'assistant', 'student'] as CohortRole[],
      required: true,
    },
    addedAt: { type: Date, default: Date.now, required: true },
    addedBy: { type: String, required: true },
  },
  { timestamps: true }
);

/**
 * One membership per (user, cohort). To give a user two roles in the
 * same cohort is not allowed by design — a person is either an
 * instructor, an assistant, or a student, not both.
 */
cohortMembershipSchema.index({ userId: 1, cohortId: 1 }, { unique: true });

/**
 * Fast lookup for "who is in this cohort".
 */
cohortMembershipSchema.index({ cohortId: 1, role: 1, addedAt: -1 });

/**
 * Fast lookup for "which cohorts is this user in".
 */
cohortMembershipSchema.index({ userId: 1, role: 1, addedAt: -1 });

export const CohortMembership = mongoose.model<CohortMembershipDocument>(
  'CohortMembership',
  cohortMembershipSchema
);