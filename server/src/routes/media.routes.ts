import { Router } from 'express';
import {
  mediaController,
  listMediaSchema,
  mediaIdSchema,
} from '../controllers/media.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireInstructor } from '../middleware/requireInstructor.js';
import { uploadMedia } from '../middleware/upload.middleware.js';

const router = Router();

router.use(requireAuth);

// List — any signed-in user (scoped to their own assets by default;
// admins may pass scope=all).
router.get('/', validate(listMediaSchema), mediaController.list);

// Read one — owner or admin.
router.get('/:id', validate(mediaIdSchema), mediaController.get);

// Upload — instructors and admins. Students cannot upload to the
// library; their draft files live client-side.
router.post(
  '/upload',
  requireInstructor,
  uploadMedia,
  mediaController.upload,
);

// Delete — owner or admin.
router.delete(
  '/:id',
  requireInstructor,
  validate(mediaIdSchema),
  mediaController.remove,
);

export default router;