import { Router } from 'express';

import {
  activityProgressController,
  activityProgressCourseSchema,
  activityProgressParamsSchema,
  sectionProgressParamsSchema,
  moduleProgressParamsSchema,
  courseProgressParamsSchema,
  startActivitySchema,
  updateActivityProgressSchema,
  completeActivitySchema,
  activityStepSchema,
  activityChallengeSchema,
} from '../controllers/activityProgress.controller.js';

import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/course/:courseId',
  validate(activityProgressCourseSchema),
  activityProgressController.getForCourse
);

router.get(
  '/course/:courseId/progress',
  validate(courseProgressParamsSchema),
  activityProgressController.getCourse
);

router.get(
  '/course/:courseId/item/:curriculumItemId',
  validate(activityProgressParamsSchema),
  activityProgressController.getForActivity
);

router.get(
  '/course/:courseId/module/:moduleId',
  validate(moduleProgressParamsSchema),
  activityProgressController.getModule
);

router.get(
  '/course/:courseId/section/:sectionId',
  validate(sectionProgressParamsSchema),
  activityProgressController.getSection
);

router.post(
  '/start',
  validate(startActivitySchema),
  activityProgressController.start
);

router.patch(
  '/',
  validate(updateActivityProgressSchema),
  activityProgressController.update
);

router.post(
  '/complete',
  validate(completeActivitySchema),
  activityProgressController.complete
);

router.post(
  '/step/complete',
  validate(activityStepSchema),
  activityProgressController.markStepComplete
);

router.post(
  '/challenge/complete',
  validate(activityChallengeSchema),
  activityProgressController.markChallengeComplete
);

export default router;