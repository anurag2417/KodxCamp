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
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';

const router = Router();

/*
 * Practice is public.
 *
 * Master Spec, section 2 (Public Navigation) and section 4
 * (Practice is public — browse without account):
 *
 *   - The catalog and the problem detail are read-only and open.
 *   - Submitting a solution, validating a client-reported result,
 *     and reading your own submission history are all user-scoped
 *     and require auth.
 *
 * `optionalAuth` on the reads attaches `req.user` when a session
 * exists, so the response can include the `solved` flag for
 * signed-in users without exposing anything to anonymous ones. The
 * controller treats a missing user as "no per-user fields".
 */
router.get(
  '/',
  optionalAuth,
  validate(listProblemsSchema),
  problemController.list
);
router.get(
  '/:slug',
  optionalAuth,
  validate(problemSlugSchema),
  problemController.getBySlug
);

/*
 * These three require a signed-in user:
 *   - validate:  echoes a client-reported result set back for the
 *                server to sanity-check; ties to a userId for the
 *                rate-limit bucket.
 *   - submit:    records a submission row, awards XP, streaks, etc.
 *   - submissions: reads the caller's own submission history.
 *
 * They are declared with `requireAuth` individually rather than
 * `router.use(requireAuth)` at the top, because the top-level
 * middleware would also block the public reads above.
 */
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