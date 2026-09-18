import { Router } from 'express';
import { progressController, markCompleteSchema } from '../controllers/progress.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:courseId', progressController.getForCourse);
router.post('/complete', validate(markCompleteSchema), progressController.markComplete);

export default router;