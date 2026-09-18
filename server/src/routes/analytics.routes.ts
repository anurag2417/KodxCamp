import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', analyticsController.overview);
router.get('/courses', analyticsController.perCourse);
router.get('/difficulty', analyticsController.difficulty);
router.get('/weekly', analyticsController.weekly);
router.get('/activity', analyticsController.recentActivity);
router.get('/heatmap', analyticsController.heatmap);

export default router;