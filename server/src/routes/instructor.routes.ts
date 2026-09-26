import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireInstructor } from '../middleware/requireInstructor.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  instructorCourseController,
  createCourseSchema,
  updateCourseSchema,
  publishSchema,
  courseSlugSchema,
  createLessonSchema,
  updateLessonSchema,
  lessonSlugSchema,
  addTeamMemberSchema,
  updateTeamMemberSchema,
  teamMemberParamsSchema,
} from '../controllers/instructor.course.controller.js';
import {
  instructorInvitationController,
  createInvitationSchema,
  invitationParamsSchema,
} from '../controllers/instructor.invitation.controller.js';
import {
  instructorStudentController,
  rosterQuerySchema,
  rosterStudentSchema,
} from '../controllers/instructor.student.controller.js';
import {
  quizController,
  createQuizQuestionSchema,
  quizParamsSchema,
} from '../controllers/quiz.controller.js';
import {
  moduleController,
  createModuleSchema,
  updateModuleSchema,
  moduleParamsSchema,
  reorderModuleSchema,
  assignLessonSchema,
  unassignLessonSchema,
} from '../controllers/module.controller.js';
import {
  cohortController,
  createCohortSchema,
  updateCohortSchema,
  cohortIdSchema,
  setArchivedSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  memberParamsSchema,
} from '../controllers/cohort.controller.js';
import {
  instructorEvaluationController,
  createReviewSchema,
  submissionParamsSchema,
  projectSubmissionsParamsSchema,
} from '../controllers/instructorEvaluation.controller.js';

const router = Router();

router.use(requireAuth, requireInstructor);

// ─── Courses ──────────────────────────────────────
router.get('/courses', instructorCourseController.listMine);
router.post(
  '/courses',
  validate(createCourseSchema),
  instructorCourseController.create
);
router.get(
  '/courses/:slug',
  validate(courseSlugSchema),
  instructorCourseController.getFull
);
router.patch(
  '/courses/:slug',
  validate(updateCourseSchema),
  instructorCourseController.update
);
router.patch(
  '/courses/:slug/publish',
  validate(publishSchema),
  instructorCourseController.setPublished
);
router.delete(
  '/courses/:slug',
  validate(courseSlugSchema),
  instructorCourseController.remove
);

// ─── Quiz questions ───────────────────────────────
router.post(
  '/courses/:slug/quiz',
  validate(createQuizQuestionSchema),
  quizController.create
);
router.get(
  '/courses/:slug/quiz',
  validate(quizParamsSchema),
  quizController.manageList
);
router.delete(
  '/courses/:slug/quiz/:questionId',
  validate(quizParamsSchema),
  quizController.remove
);

// ─── Modules ──────────────────────────────────────
router.get(
  '/courses/:courseSlug/modules',
  validate(courseSlugSchema),
  moduleController.list
);
router.post(
  '/courses/:courseSlug/modules',
  validate(createModuleSchema),
  moduleController.create
);
router.patch(
  '/courses/:courseSlug/modules/:moduleId',
  validate(updateModuleSchema),
  moduleController.update
);
router.delete(
  '/courses/:courseSlug/modules/:moduleId',
  validate(moduleParamsSchema),
  moduleController.remove
);
router.patch(
  '/courses/:courseSlug/modules/:moduleId/order',
  validate(reorderModuleSchema),
  moduleController.reorder
);
router.post(
  '/courses/:courseSlug/modules/:moduleId/lessons',
  validate(assignLessonSchema),
  moduleController.assignLesson
);
router.delete(
  '/courses/:courseSlug/modules/lessons/:lessonId',
  validate(unassignLessonSchema),
  moduleController.unassignLesson
);

// ─── Lessons ──────────────────────────────────────
router.post(
  '/courses/:courseSlug/lessons',
  validate(createLessonSchema),
  instructorCourseController.createLesson
);
router.patch(
  '/courses/:courseSlug/lessons/:lessonSlug',
  validate(updateLessonSchema),
  instructorCourseController.updateLesson
);
router.delete(
  '/courses/:courseSlug/lessons/:lessonSlug',
  validate(lessonSlugSchema),
  instructorCourseController.removeLesson
);

// ─── Cohorts ──────────────────────────────────────
router.get('/cohorts', cohortController.listMine);
router.post(
  '/cohorts',
  validate(createCohortSchema),
  cohortController.create
);
router.get(
  '/cohorts/:cohortId',
  validate(cohortIdSchema),
  cohortController.getDetail
);
router.patch(
  '/cohorts/:cohortId',
  validate(updateCohortSchema),
  cohortController.update
);
router.patch(
  '/cohorts/:cohortId/archive',
  validate(setArchivedSchema),
  cohortController.setArchived
);
router.delete(
  '/cohorts/:cohortId',
  validate(cohortIdSchema),
  cohortController.remove
);
router.post(
  '/cohorts/:cohortId/members',
  validate(addMemberSchema),
  cohortController.addMember
);
router.patch(
  '/cohorts/:cohortId/members/:userId',
  validate(updateMemberRoleSchema),
  cohortController.updateMemberRole
);
router.delete(
  '/cohorts/:cohortId/members/:userId',
  validate(memberParamsSchema),
  cohortController.removeMember
);

// ─── Project submissions + reviews ────────────────
router.get(
  '/reviews/pending',
  instructorEvaluationController.listPendingReviews
);
router.get(
  '/projects/:slug/submissions',
  validate(projectSubmissionsParamsSchema),
  instructorEvaluationController.listProjectSubmissions
);
router.get(
  '/submissions/:submissionId',
  validate(submissionParamsSchema),
  instructorEvaluationController.getSubmission
);
// CHANGED: new route. Instructors can now read AI evaluations without
// the admin role. Previously `InstructorSubmissionReview.tsx` hit the
// admin route and got a 403.
router.get(
  '/submissions/:submissionId/evaluations',
  validate(submissionParamsSchema),
  instructorEvaluationController.listEvaluations
);
router.get(
  '/submissions/:submissionId/reviews',
  validate(submissionParamsSchema),
  instructorEvaluationController.list
);
router.post(
  '/submissions/:submissionId/reviews',
  validate(createReviewSchema),
  instructorEvaluationController.create
);

// ─── Team (by user id) ────────────────────────────
router.get(
  '/courses/:slug/team',
  validate(courseSlugSchema),
  instructorCourseController.listTeam
);
router.post(
  '/courses/:slug/team/:userId',
  validate(addTeamMemberSchema),
  instructorCourseController.addTeamMember
);
router.patch(
  '/courses/:slug/team/:userId',
  validate(updateTeamMemberSchema),
  instructorCourseController.updateTeamMember
);
router.delete(
  '/courses/:slug/team/:userId',
  validate(teamMemberParamsSchema),
  instructorCourseController.removeTeamMember
);

// ─── Invitations ──────────────────────────────────
router.get(
  '/courses/:slug/invitations',
  validate(courseSlugSchema),
  instructorInvitationController.list
);
router.post(
  '/courses/:slug/invitations',
  validate(createInvitationSchema),
  instructorInvitationController.create
);
router.delete(
  '/courses/:slug/invitations/:invitationId',
  validate(invitationParamsSchema),
  instructorInvitationController.revoke
);

// ─── Students ─────────────────────────────────────
router.get(
  '/courses/:slug/students',
  validate(rosterQuerySchema),
  instructorStudentController.list
);
router.get(
  '/courses/:slug/students/:userId',
  validate(rosterStudentSchema),
  instructorStudentController.detail
);

export default router;