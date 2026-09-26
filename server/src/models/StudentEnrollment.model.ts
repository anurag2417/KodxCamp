import mongoose, { Schema, type Document } from 'mongoose';

export type EnrollmentSource = 'manual' | 'paid' | 'invited';

/**
 * A student's enrollment in a paid entity.
 *
 * Two shapes, distinguished by which id is set:
 *
 *   - `{ userId, courseId }`              → enrolled in a course
 *   - `{ userId, roadmapId }`             → enrolled in a roadmap
 *
 * Either shape may additionally carry a `cohortId` when the student
 * is enrolled via a cohort.
 *
 * Exactly one of `courseId` / `roadmapId` is set on any given row.
 * The two unique indexes below enforce this at the DB level.
 */
export interface IStudentEnrollment {
  _id: string;
  userId: string;
  courseId?: string;
  roadmapId?: string;
  /** The cohort this enrollment is attached to, if any. */
  cohortId?: string;
  joinedAt: Date;
  source: EnrollmentSource;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentEnrollmentDocument
  extends Omit<IStudentEnrollment, '_id'>,
    Document {}

const studentEnrollmentSchema = new Schema<StudentEnrollmentDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: false, index: true },
    roadmapId: { type: String, required: false, index: true },
    cohortId: { type: String, required: false, index: true },
    joinedAt: { type: Date, required: true },
    source: {
      type: String,
      enum: ['manual', 'paid', 'invited'],
      required: true,
    },
    paymentId: { type: String, default: undefined, index: true },
  },
  { timestamps: true }
);

studentEnrollmentSchema.index(
  { userId: 1, courseId: 1 },
  {
    unique: true,
    partialFilterExpression: { courseId: { $type: 'string' } },
  }
);

studentEnrollmentSchema.index(
  { userId: 1, roadmapId: 1 },
  {
    unique: true,
    partialFilterExpression: { roadmapId: { $type: 'string' } },
  }
);

studentEnrollmentSchema.index({ courseId: 1, joinedAt: -1 });
studentEnrollmentSchema.index({ roadmapId: 1, joinedAt: -1 });
studentEnrollmentSchema.index({ cohortId: 1, joinedAt: -1 });

export const StudentEnrollment = mongoose.model<StudentEnrollmentDocument>(
  'StudentEnrollment',
  studentEnrollmentSchema
);