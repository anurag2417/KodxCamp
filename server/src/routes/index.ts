import { Router } from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import roadmapRoutes from './roadmap.routes.js';
import progressRoutes from './progress.routes.js';
import problemRoutes from './problem.routes.js';
import projectRoutes from './project.routes.js';
import classRoutes from './class.routes.js';
import achievementRoutes from './achievement.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import instructorRoutes from './instructor.routes.js';
import invitationRoutes from './invitation.routes.js';
import paymentRoutes from './payment.routes.js';
import announcementRoutes from './announcement.routes.js';
import mediaRoutes from './media.routes.js';
import notificationRoutes from './notification.routes.js';
import { csrfMiddleware } from '../middleware/csrf.middleware.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'kodxcamp-api',
    time: new Date().toISOString(),
  });
});

router.use(csrfMiddleware);

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/instructor', instructorRoutes);
router.use('/progress', progressRoutes);
router.use('/problems', problemRoutes);
router.use('/projects', projectRoutes);
router.use('/classes', classRoutes);
router.use('/achievements', achievementRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/invitations', invitationRoutes);
router.use('/payments', paymentRoutes);
router.use('/announcements', announcementRoutes);
router.use('/media', mediaRoutes);
router.use('/notifications', notificationRoutes);

export default router;