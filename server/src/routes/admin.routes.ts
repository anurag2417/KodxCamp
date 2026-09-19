import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.middleware.js';

import { adminStatsController } from '../controllers/admin.stats.controller.js';
import {
  adminCourseController,
  createCourseSchema,
  updateCourseSchema,
  createLessonSchema,
  updateLessonSchema,
  lessonSlugSchema,
  courseSlugOnlySchema,
} from '../controllers/admin.course.controller.js';
import {
  adminProblemController,
  problemBodySchema,
  updateProblemSchema,
  problemSlugSchema,
} from '../controllers/admin.problem.controller.js';
import {
  adminProjectController,
  projectBodySchema,
} from '../controllers/admin.project.controller.js';
import {
  adminClassController,
  updateClassAdminSchema,
} from '../controllers/admin.class.controller.js';
import {
  adminBulkController,
  importSchema,
} from '../controllers/admin.bulk.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// ─── Stats ─────────────────────────────────────
router.get('/stats', adminStatsController.platform);

// ─── Users ─────────────────────────────────────
router.get('/users', adminStatsController.listUsers);
router.patch('/users/:userId/role', adminStatsController.setUserRole);
router.delete('/users/:userId', adminStatsController.deleteUser);

// ─── Courses ───────────────────────────────────
router.post('/courses', validate(createCourseSchema), adminCourseController.create);
router.get(
  '/courses/:slug',
  validate(courseSlugOnlySchema),
  adminCourseController.getFull
);
router.patch(
  '/courses/:slug',
  validate(updateCourseSchema),
  adminCourseController.update
);
router.delete('/courses/:slug', adminCourseController.remove);

// ─── Lessons ───────────────────────────────────
router.post(
  '/courses/:courseSlug/lessons',
  validate(createLessonSchema),
  adminCourseController.createLesson
);
router.patch(
  '/courses/:courseSlug/lessons/:lessonSlug',
  validate(updateLessonSchema),
  adminCourseController.updateLesson
);
router.delete(
  '/courses/:courseSlug/lessons/:lessonSlug',
  validate(lessonSlugSchema),
  adminCourseController.removeLesson
);

// ─── Problems ──────────────────────────────────
router.post('/problems', validate(problemBodySchema), adminProblemController.create);
router.get(
  '/problems/:slug',
  validate(problemSlugSchema),
  adminProblemController.getFull
);
router.patch(
  '/problems/:slug',
  validate(updateProblemSchema),
  adminProblemController.update
);
router.delete(
  '/problems/:slug',
  validate(problemSlugSchema),
  adminProblemController.remove
);

// ─── Projects ──────────────────────────────────
router.post('/projects', validate(projectBodySchema), adminProjectController.create);
router.get('/projects/:slug', adminProjectController.getFull);
router.patch('/projects/:slug', adminProjectController.update);
router.delete('/projects/:slug', adminProjectController.remove);

// ─── Classes ───────────────────────────────────
router.get('/classes', adminClassController.list);
router.patch(
  '/classes/:slug',
  validate(updateClassAdminSchema),
  adminClassController.update
);
router.delete('/classes/:slug', adminClassController.remove);

// ─── Bulk import ────────────────────────────────
router.post('/bulk/import', validate(importSchema), adminBulkController.import);

export default router;