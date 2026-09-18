import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  classController,
  listClassesSchema,
  classSlugSchema,
  createClassSchema,
  updateClassSchema,
  watchProgressSchema,
} from '../controllers/class.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadRecording } from '../middleware/upload.middleware.js';

const router = Router();

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);
  if (!token) return next();
  requireAuth(req as never, res, () => next());
};

router.get('/', validate(listClassesSchema), optionalAuth, classController.list);
router.get('/mine/recordings', requireAuth, classController.myRecordings);
router.get('/:slug', validate(classSlugSchema), optionalAuth, classController.getBySlug);

router.post('/', requireAuth, validate(createClassSchema), classController.create);
router.patch('/:slug', requireAuth, validate(updateClassSchema), classController.update);

router.post('/:slug/enroll', requireAuth, validate(classSlugSchema), classController.enroll);
router.delete('/:slug/enroll', requireAuth, validate(classSlugSchema), classController.unenroll);
router.post('/:slug/attend', requireAuth, validate(classSlugSchema), classController.attend);
router.post('/:slug/watch', requireAuth, validate(watchProgressSchema), classController.watchProgress);

// Recording upload
router.post(
  '/:slug/recording',
  requireAuth,
  uploadRecording,
  classController.uploadRecording
);

export default router;