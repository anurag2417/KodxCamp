import { Router } from 'express';
import { courseController, courseSlugSchema, lessonSlugSchema } from '../controllers/course.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { quizAnswerSchema, quizController, quizParamsSchema } from '../controllers/quiz.controller.js';

const router = Router();

router.get('/', courseController.list);
router.get('/:slug/lessons/:lessonSlug/quiz', validate(quizParamsSchema), requireAuth, quizController.list);
router.post('/:slug/lessons/:lessonSlug/quiz/submit', validate(quizParamsSchema), requireAuth, validate(quizAnswerSchema), quizController.submit);
router.get('/:slug', validate(courseSlugSchema), courseController.getBySlug);
router.get(
  '/:courseSlug/lessons/:lessonSlug',
  validate(lessonSlugSchema),
  courseController.getLesson
);

export default router;