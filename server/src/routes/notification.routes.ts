import { Router } from 'express';
import {
  notificationController,
  listNotificationsSchema,
  notificationIdSchema,
  updatePreferencesSchema,
} from '../controllers/notification.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listNotificationsSchema), notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.post('/mark-all-read', notificationController.markAllRead);

router.get('/preferences', notificationController.getPreferences);
router.patch(
  '/preferences',
  validate(updatePreferencesSchema),
  notificationController.updatePreferences,
);

router.patch(
  '/:id/read',
  validate(notificationIdSchema),
  notificationController.markRead,
);
router.delete(
  '/:id',
  validate(notificationIdSchema),
  notificationController.remove,
);

export default router;