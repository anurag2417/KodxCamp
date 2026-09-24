import mongoose, { Schema, type Document } from 'mongoose';

/**
 * A student's enrollment in a course.
 *
 * One row per (userId, courseId). Created the first time a student
 * interacts with a course - completing a lesson, starting one, or
 * any other course-scoped activity.
 *
 * `joinedAt` is set once, on insert. It never changes. That makes it
 * cheap to sort the roster by "who joined when" without recomputing
 * from Activity and Progress every time.
 *
 * Naming note: the `Enrollment` model already exists for live
 * classes. This is course-scoped and unrelated - do not confuse them.
 */
export interface IStudentEnrollment {
  _id: string;
  userId: string;
  courseId: string;
  joinedAt: Date;
  /**
   * How the enrollment was first established. Useful for debugging
   * and for future logic that wants to know whether the student
   * arrived via a lesson, a problem, or an explicit enrollment.
   */
  source: 'activity' | 'progress' | 'explicit';
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
      enum: ['activity', 'progress', 'explicit'],
      required: true,
    },
  },
  { timestamps: true }
);

// One enrollment per student per course.
studentEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Fast roster queries: "students in this course, sorted by joinedAt".
studentEnrollmentSchema.index({ courseId: 1, joinedAt: -1 });

export const StudentEnrollment = mongoose.model<StudentEnrollmentDocument>(
  'StudentEnrollment',
  studentEnrollmentSchema
);