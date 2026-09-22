import { Router } from 'express';
import {
  problemController,
  problemSlugSchema,
  submitSchema,
  validateResultsSchema,
} from '../controllers/problem.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';

const router = Router();

router.get('/', optionalAuth, problemController.list);
router.get(
  '/:slug',
  validate(problemSlugSchema),
  optionalAuth,
  problemController.getBySlug
);

router.post(
  '/validate',
  requireAuth,
  validate(validateResultsSchema),
  problemController.validate
);
router.post(
  '/submit',
  requireAuth,
  validate(submitSchema),
  problemController.submit
);
router.get(
  '/:problemId/submissions',
  requireAuth,
  problemController.submissions
);

export default router;