import { Router } from 'express';
import {
  projectController,
  projectSlugSchema,
  saveProjectSchema,
} from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';

const router = Router();

router.get('/', optionalAuth, projectController.list);
router.get('/mine', requireAuth, projectController.myProjects);
router.get(
  '/:slug',
  validate(projectSlugSchema),
  optionalAuth,
  projectController.getBySlug
);

router.post(
  '/:slug/start',
  requireAuth,
  validate(projectSlugSchema),
  projectController.start
);
router.post(
  '/:slug/save',
  requireAuth,
  validate(saveProjectSchema),
  projectController.save
);
router.post(
  '/:slug/complete',
  requireAuth,
  validate(projectSlugSchema),
  projectController.complete
);

export default router;