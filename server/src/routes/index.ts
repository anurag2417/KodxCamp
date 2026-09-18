import { Router } from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import progressRoutes from './progress.routes.js';
import problemRoutes from './problem.routes.js';
import projectRoutes from './project.routes.js';
import classRoutes from './class.routes.js';
import achievementRoutes from './achievement.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kodxcamp-api', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/progress', progressRoutes);
router.use('/problems', problemRoutes);
router.use('/projects', projectRoutes);
router.use('/classes', classRoutes);
router.use('/achievements', achievementRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

export default router;