import { Router } from 'express';
import { achievementController } from '../controllers/achievement.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', achievementController.listDefinitions);
router.get('/mine', requireAuth, achievementController.listMine);

export default router;