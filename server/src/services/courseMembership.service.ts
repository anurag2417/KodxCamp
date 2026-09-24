import mongoose from 'mongoose';
import {
  CourseMembership,
  type CourseTeamRole,
} from '../models/CourseMembership.model.js';
import { Course } from '../models/Course.model.js';
import { logger } from '../utils/logger.js';

/**
 * Legacy role names used by `Course.members[]` before Batch 2. These
 * come from the old taxonomy: `lead | author | reviewer | ta | viewer`.
 * `CourseMembership` uses the new taxonomy in `permissions.ts`:
 * `lead | course_author | problem_author | class_coordinator | ta | viewer`.
 */
type LegacyRole = 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer';

interface LegacyMember {
  userId: string;
  role: LegacyRole;
  addedAt?: Date;
  addedBy?: string;
}

function translateLegacyRole(role: LegacyRole): CourseTeamRole {
  switch (role) {
    case 'lead':
      return 'lead';
    case 'author':
      return 'course_author';
    case 'reviewer':
      return 'viewer';
    case 'ta':
      return 'ta';
    case 'viewer':
      return 'viewer';
  }
}

export const courseMembershipService = {
  async getRole(
    userId: string,
    courseId: string
  ): Promise<CourseTeamRole | null> {
    const doc = await CourseMembership.findOne({ userId, courseId })
      .select('role')
      .lean();
    return doc ? (doc.role as CourseTeamRole) : null;
  },

  async listForUser(userId: string) {
    return CourseMembership.find({ userId })
      .sort({ addedAt: -1 })
      .lean();
  },

  async listForCourse(courseId: string) {
    return CourseMembership.find({ courseId })
      .sort({ addedAt: 1 })
      .lean();
  },

  async isMember(userId: string, courseId: string): Promise<boolean> {
    const count = await CourseMembership.countDocuments({ userId, courseId });
    return count > 0;
  },

  async upsert(input: {
    userId: string;
    courseId: string;
    role: CourseTeamRole;
    addedBy: string;
  }) {
    return CourseMembership.findOneAndUpdate(
      { userId: input.userId, courseId: input.courseId },
      {
        $set: {
          role: input.role,
          addedBy: input.addedBy,
        },
        $setOnInsert: {
          userId: input.userId,
          courseId: input.courseId,
          addedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();
  },

  async remove(userId: string, courseId: string) {
    await CourseMembership.deleteOne({ userId, courseId });
  },

  /**
   * Backfill `CourseMembership` from any course that still has a
   * legacy `members[]` array.
   *
   * After Batch 2D the `members` field is not in the Course schema,
   * so this reads it via the raw MongoDB collection. After the 2D
   * migration has run once, no document will have `members` and this
   * is a no-op.
   *
   * Idempotent: existing rows are updated to match the legacy role.
   */
  async syncFromLegacyMembers(): Promise<{
    coursesScanned: number;
    membershipsWritten: number;
    errors: { courseId: string; error: string }[];
  }> {
    // Read the raw documents directly so TypeScript doesn't complain
    // about a schema field that no longer exists. `Course.collection`
    // exposes the underlying MongoDB collection; its generic parameter
    // is loose, so we annotate the projection explicitly.
    const rawCourses = await Course.collection
      .find({ 'members.0': { $exists: true } })
      .project<{
        _id: mongoose.Types.ObjectId;
        createdBy?: string;
        members?: LegacyMember[];
      }>({
        _id: 1,
        createdBy: 1,
        members: 1,
      })
      .toArray();

    let membershipsWritten = 0;
    const errors: { courseId: string; error: string }[] = [];

    for (const course of rawCourses) {
      const courseId = course._id.toString();
      const members = course.members ?? [];

      for (const member of members) {
        try {
          await this.upsert({
            userId: member.userId,
            courseId,
            role: translateLegacyRole(member.role),
            addedBy: member.addedBy ?? course.createdBy ?? 'system',
          });
          membershipsWritten++;
        } catch (err) {
          errors.push({
            courseId,
            error: err instanceof Error ? err.message : String(err),
          });
          logger.warn('CourseMembership backfill failed for one member', {
            courseId,
            userId: member.userId,
            err: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    return {
      coursesScanned: rawCourses.length,
      membershipsWritten,
      errors,
    };
  },
};