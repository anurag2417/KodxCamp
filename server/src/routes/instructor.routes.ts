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

const router = Router();

// Every instructor route requires auth + instructor/admin role
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

// ─── Team ─────────────────────────────────────────
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

export default router;