import type { UserRole } from './user.js';

/**
 * A cohort is a specific group of students going through a learning
 * experience together.
 *
 * Master Spec, section 69:
 *   "Course  =  What is being taught
 *    Cohort  =  Who is being taught, by whom, and when"
 *
 * A cohort is scoped to exactly one entity. That entity is either a
 * course or a roadmap. A roadmap cohort lets you run "Full Stack
 * 2026-A" against the roadmap; a course cohort lets you run
 * "HTML & CSS 2026-Spring" against a standalone course that isn't
 * part of a roadmap.
 *
 * The scoping is done via `entityKind` + `entityId` (a pair) rather
 * than two nullable fields, so the invariant "exactly one of these is
 * set" is enforced by the discriminator rather than by a runtime check.
 */
export type CohortEntityKind = 'course' | 'roadmap';

/**
 * A user's role inside a cohort.
 *
 *   - `instructor` — teaches the cohort, can see its roster, run its
 *                    classes, and grade submissions.
 *   - `assistant`  — a TA. Can see the roster but cannot schedule
 *                    classes or edit the cohort.
 *   - `student`    — the default. Is a member of the learning cohort.
 *
 * Note that a user can be a student in one cohort and an instructor
 * in another. The role is per-(user, cohort), not global.
 */
export type CohortRole = 'instructor' | 'assistant' | 'student';

export interface ICohort {
  _id: string;
  name: string;
  slug: string;
  description?: string;

  /**
   * What this cohort teaches. Either a course or a roadmap.
   */
  entityKind: CohortEntityKind;
  entityId: string;

  /**
   * The date range. Free-form strings (e.g. `'2026-01'`, `'2026-04'`)
   * rather than `Date` values, because cohorts are labelled by
   * month/season, not scheduled to the day.
   */
  startDate?: string;
  endDate?: string;

  /**
   * Optional display ordering — used to sort the instructor dashboard.
   * Lower numbers appear first. The service assigns `Date.now()` on
   * create if not provided.
   */
  displayOrder: number;

  archived: boolean;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A member of a cohort. One row per `(userId, cohortId)`.
 */
export interface ICohortMembership {
  _id: string;
  userId: string;
  cohortId: string;
  role: CohortRole;
  addedAt: Date;
  addedBy: string;
}

/**
 * A cohort with its entity (course or roadmap) summary attached, for
 * the instructor dashboard's list view.
 */
export interface ICohortSummary {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  entityKind: CohortEntityKind;
  entityId: string;
  /** Title of the course or roadmap this cohort teaches. */
  entityTitle: string;
  /** Slug of the course or roadmap. */
  entitySlug: string;
  startDate?: string;
  endDate?: string;
  archived: boolean;
  studentCount: number;
  instructorCount: number;
  createdAt: Date;
}

/**
 * A cohort with its full roster and instructor list, for the detail
 * page.
 */
export interface ICohortDetail {
  cohort: ICohort;
  entity: {
    kind: CohortEntityKind;
    _id: string;
    title: string;
    slug: string;
    description: string;
    language?: string;
    thumbnail?: string;
  };
  instructors: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
  }[];
  assistants: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
  }[];
  students: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    joinedAt: Date;
  }[];
}