import { Router } from 'express';
import {
  announcementController,
  createAnnouncementSchema,
  announcementIdSchema,
} from '../controllers/announcement.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireInstructor } from '../middleware/requireInstructor.js';

const router = Router();

router.use(requireAuth);

// Reads — any signed-in user.
router.get('/', announcementController.list);
router.get('/mine', requireInstructor, announcementController.mine);

// Writes — instructors and admins. The controller enforces the
// per-audience authorization; the route only gates by role.
router.post(
  '/',
  requireInstructor,
  validate(createAnnouncementSchema),
  announcementController.create,
);

router.delete(
  '/:id',
  requireInstructor,
  validate(announcementIdSchema),
  announcementController.remove,
);

export default router;