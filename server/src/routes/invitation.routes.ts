import { Router } from 'express';
import {
  instructorInvitationController,
  resolveInvitationSchema,
  acceptInvitationSchema,
} from '../controllers/instructor.invitation.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public - resolve an invitation token.
router.get(
  '/:token',
  validate(resolveInvitationSchema),
  instructorInvitationController.resolve
);

// Authenticated - accept.
router.post(
  '/:token/accept',
  requireAuth,
  validate(acceptInvitationSchema),
  instructorInvitationController.accept
);

export default router;