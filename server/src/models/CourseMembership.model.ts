import mongoose, { Schema, type Document } from 'mongoose';

/**
 * Course-scoped staff role. Values must match `COURSE_TEAM_ROLES` in
 * `shared/src/types/permissions.ts`.
 */
export type CourseTeamRole =
  | 'lead'
  | 'course_author'
  | 'problem_author'
  | 'class_coordinator'
  | 'ta'
  | 'viewer';

export interface CourseMembershipDocument extends Document {
  userId: string;
  courseId: string;
  role: CourseTeamRole;
  addedAt: Date;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseMembershipSchema = new Schema<CourseMembershipDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: [
        'lead',
        'course_author',
        'problem_author',
        'class_coordinator',
        'ta',
        'viewer',
      ] as CourseTeamRole[],
      required: true,
    },
    addedAt: { type: Date, required: true, default: Date.now },
    addedBy: { type: String, required: true },
  },
  { timestamps: true }
);

/**
 * One membership per (user, course) pair. To give a user two roles on
 * the same course, this schema needs to change - and it's a
 * deliberate design choice not to. Global permissions handle the
 * "what" axis; this collection handles the "where".
 */
courseMembershipSchema.index({ userId: 1, courseId: 1 }, { unique: true });

/**
 * Fast lookup for "who is on this course's team".
 */
courseMembershipSchema.index({ courseId: 1, addedAt: -1 });

/**
 * Fast lookup for "which courses does this user staff".
 */
courseMembershipSchema.index({ userId: 1, addedAt: -1 });

export const CourseMembership = mongoose.model<CourseMembershipDocument>(
  'CourseMembership',
  courseMembershipSchema
);