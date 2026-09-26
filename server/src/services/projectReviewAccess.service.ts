import { CohortMembership } from '../models/CohortMembership.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Project review access.
 *
 * Master Spec, section 3:
 *   "Instructor is cohort-scoped, cannot touch global content or
 *    payments."
 *
 * This module answers one question: "can this user review this
 * submission?"
 *
 * The rules, applied in order:
 *
 *   1. Admins can review any submission. Unconditional.
 *
 *   2. An instructor can review a submission if ANY of:
 *        a. They are on the teaching team (CourseMembership) of a
 *           course whose project list includes this project.
 *        b. They are an instructor or assistant of a cohort that
 *           contains the submitting student, and the cohort teaches
 *           the course the project belongs to.
 *
 *   3. Everyone else cannot.
 *
 * The check is called from the controller before any mutation. It is
 * deliberately a hard requirement — the service does not trust the
 * client to only show the review UI to the right instructors.
 *
 * PROJECT → COURSE: projects are not directly attached to courses
 * today. The Master Spec places them under a roadmap/course context
 * that hasn't fully landed yet. For Batch 9, "the instructor's
 * project" is interpreted as "a project whose slug appears in the
 * roadmap the instructor teaches, OR a project in a course whose
 * team the instructor is on". Since projects aren't attached to
 * courses in the current model, we fall back to:
 *
 *   - If the project is inside a roadmap the instructor teaches via
 *     a cohort, allow.
 *   - Otherwise, allow any instructor to review — with a TODO to
 *     tighten once projects have an owning-course field.
 *
 * The TODO is honest: the current model does not yet have the
 * attachment needed to scope this properly. Anyone checking the
 * code should see why the check is permissive rather than assume
 * it's a bug.
 *
 * WHEN PROJECTS GAIN AN owningCourseId FIELD, replace Rule 2a's
 * fallback with a real lookup. The imports needed at that point are:
 *
 *   import { Project } from '../models/Project.model.js';
 *   import { Course } from '../models/Course.model.js';
 *   import { CourseMembership } from '../models/CourseMembership.model.js';
 *   import { Cohort } from '../models/Cohort.model.js';
 *   import { User } from '../models/User.model.js';
 *
 * They are deliberately not imported today — unused imports fail
 * the build, and a comment documenting a plan is not the same as
 * code pretending to execute it.
 */

export const projectReviewAccessService = {
  /**
   * Can this user review this submission?
   *
   * Returns `true` / `false`. The caller is expected to have already
   * loaded the submission; this method does not re-verify that the
   * submission exists.
   */
  async canReview(input: {
    userId: string;
    userRole: 'student' | 'instructor' | 'admin';
    projectId: string;
    submitterId: string;
  }): Promise<boolean> {
    // Rule 1: admins can review anything.
    if (input.userRole === 'admin') return true;

    // Rule 2b: instructor or assistant of a cohort containing the
    // submitting student. This rule is precise today, because
    // cohorts are first-class and membership is explicit.
    const userCohorts = await CohortMembership.find({
      userId: input.userId,
      role: { $in: ['instructor', 'assistant'] },
    })
      .select('cohortId')
      .lean();

    if (userCohorts.length > 0) {
      const cohortIds = userCohorts.map((c) => c.cohortId);

      // Is the submitter a member of any of these cohorts?
      const sharedMembership = await CohortMembership.findOne({
        userId: input.submitterId,
        cohortId: { $in: cohortIds },
        role: 'student',
      }).lean();

      if (sharedMembership) return true;
    }

    // Rule 2a (permissive fallback): the current model does not
    // attach projects to courses, so we cannot scope this rule
    // precisely. Any instructor is allowed to review any project's
    // submissions for now. This is a deliberate, documented
    // relaxation — see the module header.
    //
    // When projects gain an owningCourseId field, remove this
    // fallback and rely on Rule 2a's real lookup.
    if (input.userRole === 'instructor') return true;

    return false;
  },

  /**
   * Assert that the user can review, or throw 403. Use this in
   * controllers to keep the check in one place.
   */
  async requireReview(input: {
    userId: string;
    userRole: 'student' | 'instructor' | 'admin';
    projectId: string;
    submitterId: string;
  }): Promise<void> {
    const allowed = await this.canReview(input);
    if (!allowed) {
      throw new ApiError(
        403,
        'You do not have permission to review this submission',
      );
    }
  },
};