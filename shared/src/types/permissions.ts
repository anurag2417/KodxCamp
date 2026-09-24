/**
 * Global permissions. A user has any subset of these, stored in
 * `User.permissions[]`. Independent of `User.role`.
 *
 *   - problem_author    -> can create/edit/delete problems and their
 *                          test cases (global problem catalog)
 *   - project_author    -> can create/edit/delete projects (global
 *                          project catalog)
 *   - course_author     -> can create courses and edit their content
 *                          (subject to per-course team membership for
 *                          edit rights; creation is a platform-level
 *                          action)
 *   - class_coordinator -> can schedule classes, upload recordings,
 *                          manage class resources
 *
 * `admin` implicitly has all of these. The check helper in
 * `permissions.service.ts` short-circuits admins.
 */
export const GLOBAL_PERMISSIONS = [
  'problem_author',
  'project_author',
  'course_author',
  'class_coordinator',
] as const;

export type GlobalPermission = (typeof GLOBAL_PERMISSIONS)[number];

/**
 * Course-scoped roles. A user has at most one per course, stored in
 * the `CourseMembership` collection. This is the "where can they do
 * it" axis.
 *
 *   - lead              -> owns the course, manages the team
 *   - course_author     -> edits course content (lessons, quizzes)
 *   - problem_author    -> edits problems attached to this course
 *                          (course-scoped problems only)
 *   - class_coordinator -> schedules and manages this course's classes
 *   - ta                -> sees the student roster, no content edits
 *   - viewer            -> read-only access to the course editor
 */
export const COURSE_TEAM_ROLES = [
  'lead',
  'course_author',
  'problem_author',
  'class_coordinator',
  'ta',
  'viewer',
] as const;

export type CourseTeamRole = (typeof COURSE_TEAM_ROLES)[number];

/**
 * Student enrollment sources. Matches `StudentEnrollment.source`.
 */
export const ENROLLMENT_SOURCES = ['manual', 'paid', 'invited'] as const;
export type EnrollmentSource = (typeof ENROLLMENT_SOURCES)[number];