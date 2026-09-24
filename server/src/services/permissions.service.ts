import { CourseMembership } from '../models/CourseMembership.model.js';

/**
 * Course-scoped staff roles. Must match `COURSE_TEAM_ROLES` in
 * `shared/src/types/permissions.ts`.
 */
export type CourseTeamRole =
  | 'lead'
  | 'course_author'
  | 'problem_author'
  | 'class_coordinator'
  | 'ta'
  | 'viewer';

/**
 * The resolved role of a user for a specific course.
 *
 *  - `'admin'`   -> global admin, bypasses all course checks
 *  - a team role -> the user's CourseMembership.role for this course
 *  - `null`      -> not on the team
 */
export type EffectiveCourseRole = 'admin' | CourseTeamRole | null;

export interface UserIdentity {
  _id: string;
  role: string;
}

/**
 * Resolve a user's effective role on a course.
 *
 * Admins short-circuit to `'admin'` without a database query.
 * Everyone else is looked up in `CourseMembership`.
 */
async function resolveEffectiveRole(
  user: UserIdentity,
  courseId: string
): Promise<EffectiveCourseRole> {
  if (user.role === 'admin') return 'admin';

  const membership = await CourseMembership.findOne({
    userId: user._id,
    courseId,
  })
    .select('role')
    .lean();

  return membership ? (membership.role as CourseTeamRole) : null;
}

/**
 * Permission checks, now expressed in terms of a resolved role.
 *
 * These were previously synchronous and read from a `CourseLike`
 * object with a `members[]` array. After the Batch 2C read flip, the
 * only source of truth is the `CourseMembership` collection, so every
 * check takes the *already-resolved* role as a plain string. Callers
 * do one `resolveEffectiveRole` call per request and pass the result
 * around.
 *
 * Admins implicitly pass every check by passing `'admin'`.
 */
export const permissions = {
  /**
   * Resolve the effective role for a user on a course. Database hit
   * for non-admins; short-circuits for admins.
   */
  resolveEffectiveRole,

  /** Is this role considered "on the course"? */
  canAccessCourse(role: EffectiveCourseRole): boolean {
    return role !== null;
  },

  /** Can this role edit course content (lessons, quizzes)? */
  canEditContent(role: EffectiveCourseRole): boolean {
    return (
      role === 'admin' ||
      role === 'lead' ||
      role === 'course_author' ||
      role === 'problem_author'
    );
  },

  /** Can this role publish/unpublish the course and delete it? */
  canManageCourse(role: EffectiveCourseRole): boolean {
    return role === 'admin' || role === 'lead';
  },

  /** Can this role add/remove team members? */
  canManageTeam(role: EffectiveCourseRole): boolean {
    return role === 'admin' || role === 'lead';
  },

  /** Can this role see the student roster? */
  canViewStudents(role: EffectiveCourseRole): boolean {
    return (
      role === 'admin' ||
      role === 'lead' ||
      role === 'course_author' ||
      role === 'ta'
    );
  },

  /** Can this role create/update/delete classes for this course? */
  canManageClasses(role: EffectiveCourseRole): boolean {
    return (
      role === 'admin' ||
      role === 'lead' ||
      role === 'course_author' ||
      role === 'class_coordinator'
    );
  },
};