import { Router } from 'express';
import {
  roadmapController,
  roadmapSlugSchema,
} from '../controllers/roadmap.controller.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

/**
 * Public roadmap catalog.
 *
 * `optionalAuth` attaches `req.user` when a valid session exists, so
 * future endpoints on this router can vary their response by user
 * without changing the middleware stack. For now, the controller
 * treats the call as public either way.
 */
router.get('/', optionalAuth, roadmapController.list);

router.get(
  '/:slug',
  validate(roadmapSlugSchema),
  optionalAuth,
  roadmapController.getBySlug
);

export default router;