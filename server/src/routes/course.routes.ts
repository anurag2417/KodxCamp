import { Router } from 'express';
import { courseController, courseSlugSchema, lessonSlugSchema } from '../controllers/course.controller.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/', courseController.list);
router.get('/:slug', validate(courseSlugSchema), courseController.getBySlug);
router.get(
  '/:courseSlug/lessons/:lessonSlug',
  validate(lessonSlugSchema),
  courseController.getLesson
);

export default router;