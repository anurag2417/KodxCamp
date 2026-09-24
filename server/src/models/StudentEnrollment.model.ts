import mongoose, { Schema, type Document } from 'mongoose';

export type EnrollmentSource = 'manual' | 'paid' | 'invited';

export interface IStudentEnrollment {
  _id: string;
  userId: string;
  courseId: string;
  joinedAt: Date;
  source: EnrollmentSource;
  /**
   * If the enrollment was created by a Razorpay payment, this is the
   * `Payment._id`. Null for manual and invited enrollments.
   */
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
    courseId: { type: String, required: true, index: true },
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

studentEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
studentEnrollmentSchema.index({ courseId: 1, joinedAt: -1 });

export const StudentEnrollment = mongoose.model<StudentEnrollmentDocument>(
  'StudentEnrollment',
  studentEnrollmentSchema
);