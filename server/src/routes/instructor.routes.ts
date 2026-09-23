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