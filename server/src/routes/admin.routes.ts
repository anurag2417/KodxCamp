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
  adminBulkController,
  importSchema,
} from '../controllers/admin.bulk.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// Stats + Users
router.get('/stats', adminStatsController.platform);
router.get('/users', adminStatsController.listUsers);
router.patch('/users/:userId/role', adminStatsController.setUserRole);
router.delete('/users/:userId', adminStatsController.deleteUser);

// Problems (admin-only)
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

// Projects (admin-only)
router.post('/projects', validate(projectBodySchema), adminProjectController.create);
router.get('/projects/:slug', adminProjectController.getFull);
router.patch('/projects/:slug', adminProjectController.update);
router.delete('/projects/:slug', adminProjectController.remove);

// Classes (admin override)
router.get('/classes', adminClassController.list);
router.patch(
  '/classes/:slug',
  validate(updateClassAdminSchema),
  adminClassController.update
);
router.delete('/classes/:slug', adminClassController.remove);

// Bulk import (admin-only)
router.post('/bulk/import', validate(importSchema), adminBulkController.import);

export default router;