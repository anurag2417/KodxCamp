import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  problemController,
  problemSlugSchema,
  submitSchema,
  validateResultsSchema,
} from '../controllers/problem.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Optional auth: attach user if a valid token exists, but never fail
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) return next();
  requireAuth(req as never, res, () => next());
};

router.get('/', optionalAuth, problemController.list);
router.get('/:slug', validate(problemSlugSchema), optionalAuth, problemController.getBySlug);

router.post('/validate', requireAuth, validate(validateResultsSchema), problemController.validate);
router.post('/submit', requireAuth, validate(submitSchema), problemController.submit);
router.get('/:problemId/submissions', requireAuth, problemController.submissions);

export default router;