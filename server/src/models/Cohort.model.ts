import mongoose, { Schema, type Document } from 'mongoose';

export type CohortEntityKind = 'course' | 'roadmap';

export interface CohortDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  entityKind: CohortEntityKind;
  entityId: string;
  startDate?: string;
  endDate?: string;
  displayOrder: number;
  archived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const cohortSchema = new Schema<CohortDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: undefined },

    entityKind: {
      type: String,
      enum: ['course', 'roadmap'] as CohortEntityKind[],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },

    startDate: { type: String, default: undefined },
    endDate: { type: String, default: undefined },

    displayOrder: { type: Number, default: () => Date.now() },
    archived: { type: Boolean, default: false, index: true },

    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

/**
 * Compound index for "cohorts of this course/roadmap, non-archived
 * first, in display order". This is the primary query shape.
 */
cohortSchema.index({
  entityKind: 1,
  entityId: 1,
  archived: 1,
  displayOrder: 1,
});

export const Cohort = mongoose.model<CohortDocument>('Cohort', cohortSchema);