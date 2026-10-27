import { Router } from 'express';
import {
  curriculumController,
  curriculumCourseSchema,
  sectionParamsSchema,
  itemParamsSchema,
  createSectionSchema,
  updateSectionSchema,
  reorderSectionSchema,
  createCurriculumItemSchema,
  updateCurriculumItemSchema,
  reorderCurriculumItemSchema,
} from '../controllers/curriculum.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireInstructor } from '../middleware/requireInstructor.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.get(
  '/courses/:courseSlug',
  requireAuth,
  validate(curriculumCourseSchema),
  curriculumController.getStudentCurriculum
);

router.get(
  '/instructor/courses/:courseSlug',
  requireAuth,
  requireInstructor,
  validate(curriculumCourseSchema),
  curriculumController.getInstructorCurriculum
);

router.post(
  '/instructor/courses/:courseSlug/sections',
  requireAuth,
  requireInstructor,
  validate(createSectionSchema),
  curriculumController.createSection
);

router.patch(
  '/instructor/courses/:courseSlug/sections/:sectionId',
  requireAuth,
  requireInstructor,
  validate(updateSectionSchema),
  curriculumController.updateSection
);

router.delete(
  '/instructor/courses/:courseSlug/sections/:sectionId',
  requireAuth,
  requireInstructor,
  validate(sectionParamsSchema),
  curriculumController.deleteSection
);

router.patch(
  '/instructor/courses/:courseSlug/sections/:sectionId/order',
  requireAuth,
  requireInstructor,
  validate(reorderSectionSchema),
  curriculumController.reorderSection
);

router.post(
  '/instructor/courses/:courseSlug/items',
  requireAuth,
  requireInstructor,
  validate(createCurriculumItemSchema),
  curriculumController.createItem
);

router.patch(
  '/instructor/courses/:courseSlug/items/:itemId',
  requireAuth,
  requireInstructor,
  validate(updateCurriculumItemSchema),
  curriculumController.updateItem
);

router.delete(
  '/instructor/courses/:courseSlug/items/:itemId',
  requireAuth,
  requireInstructor,
  validate(itemParamsSchema),
  curriculumController.deleteItem
);

router.patch(
  '/instructor/courses/:courseSlug/items/:itemId/order',
  requireAuth,
  requireInstructor,
  validate(reorderCurriculumItemSchema),
  curriculumController.reorderItem
);

export default router;