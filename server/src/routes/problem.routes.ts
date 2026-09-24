import { Router } from 'express';
import {
  problemController,
  problemSlugSchema,
  submitSchema,
  validateResultsSchema,
  listProblemsSchema,
} from '../controllers/problem.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Practice requires login. Browsing and submitting both need an
// authenticated user, so `requireAuth` gates the entire router.
router.use(requireAuth);

router.get('/', validate(listProblemsSchema), problemController.list);
router.get(
  '/:slug',
  validate(problemSlugSchema),
  problemController.getBySlug
);

router.post(
  '/validate',
  validate(validateResultsSchema),
  problemController.validate
);
router.post(
  '/submit',
  validate(submitSchema),
  problemController.submit
);
router.get('/:problemId/submissions', problemController.submissions);

export default router;