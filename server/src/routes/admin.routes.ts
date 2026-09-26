import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.middleware.js';

import { adminStatsController } from '../controllers/admin.stats.controller.js';
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
  adminCourseController,
  adminCreateCourseSchema,
  adminUpdateCourseSchema,
  adminCourseSlugSchema,
} from '../controllers/admin.course.controller.js';
import {
  adminEnrollmentController,
  setCoursePricingSchema,
  adminEnrollSchema,
  listEnrollmentsSchema,
} from '../controllers/admin.enrollment.controller.js';
import {
  adminBulkController,
  importSchema,
} from '../controllers/admin.bulk.controller.js';
import {
  adminRoadmapController,
  adminCreateRoadmapSchema,
  adminUpdateRoadmapSchema,
  adminSetPublishedSchema,
  roadmapSlugSchema,
} from '../controllers/roadmap.controller.js';
import {
  adminCohortController,
  createCohortSchema,
  updateCohortSchema,
  cohortIdSchema,
  setArchivedSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  memberParamsSchema,
} from '../controllers/cohort.controller.js';
import {
  aiEvaluationController,
  submissionIdParamsSchema,
  projectSlugParamSchema,
  listEvaluationsQuerySchema,
} from '../controllers/aiEvaluation.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// ─── Stats + Users ────────────────────────────────────────────────
router.get('/stats', adminStatsController.platform);
router.get('/users', adminStatsController.listUsers);
router.get('/instructors', adminStatsController.listInstructors);
router.patch('/users/:userId/role', adminStatsController.setUserRole);
router.delete('/users/:userId', adminStatsController.deleteUser);

// ─── Courses ──────────────────────────────────────────────────────
router.get('/courses', adminCourseController.list);
router.post(
  '/courses',
  validate(adminCreateCourseSchema),
  adminCourseController.create
);
router.get(
  '/courses/:slug',
  validate(adminCourseSlugSchema),
  adminCourseController.getFull
);
router.patch(
  '/courses/:slug',
  validate(adminUpdateCourseSchema),
  adminCourseController.update
);
router.delete(
  '/courses/:slug',
  validate(adminCourseSlugSchema),
  adminCourseController.remove
);

// ─── Roadmaps ─────────────────────────────────────────────────────
router.get('/roadmaps', adminRoadmapController.list);
router.post(
  '/roadmaps',
  validate(adminCreateRoadmapSchema),
  adminRoadmapController.create
);
router.get(
  '/roadmaps/:slug',
  validate(roadmapSlugSchema),
  adminRoadmapController.getFull
);
router.patch(
  '/roadmaps/:slug',
  validate(adminUpdateRoadmapSchema),
  adminRoadmapController.update
);
router.patch(
  '/roadmaps/:slug/publish',
  validate(adminSetPublishedSchema),
  adminRoadmapController.setPublished
);
router.delete(
  '/roadmaps/:slug',
  validate(roadmapSlugSchema),
  adminRoadmapController.remove
);

// ─── Cohorts ──────────────────────────────────────────────────────
router.get('/cohorts', adminCohortController.list);
router.post(
  '/cohorts',
  validate(createCohortSchema),
  adminCohortController.create
);
router.get(
  '/cohorts/:cohortId',
  validate(cohortIdSchema),
  adminCohortController.getDetail
);
router.patch(
  '/cohorts/:cohortId',
  validate(updateCohortSchema),
  adminCohortController.update
);
router.patch(
  '/cohorts/:cohortId/archive',
  validate(setArchivedSchema),
  adminCohortController.setArchived
);
router.delete(
  '/cohorts/:cohortId',
  validate(cohortIdSchema),
  adminCohortController.remove
);
router.post(
  '/cohorts/:cohortId/members',
  validate(addMemberSchema),
  adminCohortController.addMember
);
router.patch(
  '/cohorts/:cohortId/members/:userId',
  validate(updateMemberRoleSchema),
  adminCohortController.updateMemberRole
);
router.delete(
  '/cohorts/:cohortId/members/:userId',
  validate(memberParamsSchema),
  adminCohortController.removeMember
);

// ─── Course pricing + enrollment ──────────────────────────────────
router.patch(
  '/courses/:slug/pricing',
  validate(setCoursePricingSchema),
  adminEnrollmentController.setPricing
);
router.get(
  '/courses/:slug/enrollments',
  validate(listEnrollmentsSchema),
  adminEnrollmentController.list
);
router.post(
  '/courses/:slug/enroll',
  validate(adminEnrollSchema),
  adminEnrollmentController.enroll
);
router.delete(
  '/courses/:slug/enrollments/:userId',
  adminEnrollmentController.revoke
);

// ─── Problems ─────────────────────────────────────────────────────
router.post(
  '/problems',
  validate(problemBodySchema),
  adminProblemController.create
);
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

// ─── Projects (CRUD) ──────────────────────────────────────────────
//
// CRUD routes are declared FIRST so `/:slug` matches project slugs
// before the submission router below takes over the `submissions`
// segment. Express is order-sensitive: the literal `submissions`
// segment would never be reached if `/:slug` came first.
router.post(
  '/projects',
  validate(projectBodySchema),
  adminProjectController.create
);
router.patch('/projects/:slug', adminProjectController.update);
router.delete('/projects/:slug', adminProjectController.remove);

// ─── Project submissions + AI evaluation ──────────────────────────
//
// Declared BEFORE the `/projects/:slug` GET so the literal
// `submissions` segment wins. GET `/projects/:slug` is registered
// last in this file for that reason — see below.
router.get(
  '/projects/:slug/submissions',
  validate(projectSlugParamSchema),
  aiEvaluationController.listProjectSubmissions
);
router.get(
  '/projects/submissions/:submissionId',
  validate(submissionIdParamsSchema),
  aiEvaluationController.getSubmission
);
router.get(
  '/projects/submissions/:submissionId/evaluations',
  validate(listEvaluationsQuerySchema),
  aiEvaluationController.listForSubmission
);
router.post(
  '/projects/submissions/:submissionId/evaluate',
  validate(submissionIdParamsSchema),
  aiEvaluationController.evaluate
);

// ─── AI subsystem status ──────────────────────────────────────────
router.get('/ai/status', aiEvaluationController.status);

// ─── Projects — read one (must come after `/projects/submissions/*`) ─
router.get('/projects/:slug', adminProjectController.getFull);

// ─── Classes ──────────────────────────────────────────────────────
router.get('/classes', adminClassController.list);
router.patch(
  '/classes/:slug',
  validate(updateClassAdminSchema),
  adminClassController.update
);
router.delete('/classes/:slug', adminClassController.remove);

// ─── Bulk import ──────────────────────────────────────────────────
router.post('/bulk/import', validate(importSchema), adminBulkController.import);

export default router;