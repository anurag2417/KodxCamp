import mongoose, { Schema, type Document } from 'mongoose';

export interface IEnrollment {
  _id: string;
  classId: string;
  userId: string;
  joinedAt: Date;
  attendedAt?: Date;
  attendedSeconds?: number;
  watchedSeconds?: number;
  recordingCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentDocument extends Omit<IEnrollment, '_id'>, Document {}

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    classId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    joinedAt: { type: Date, default: Date.now },
    attendedAt: { type: Date },
    attendedSeconds: { type: Number },
    watchedSeconds: { type: Number, default: 0 },
    recordingCompletedAt: { type: Date },
  },
  { timestamps: true }
);

enrollmentSchema.index({ classId: 1, userId: 1 }, { unique: true });

export const Enrollment = mongoose.model<EnrollmentDocument>(
  'Enrollment',
  enrollmentSchema
);