import type { Response } from 'express';
import { achievementService } from '../services/achievement.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const achievementController = {
  listDefinitions: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const defs = await achievementService.listDefinitions();
    return ApiResponse.success(res, defs);
  }),

  listMine: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const unlocked = await achievementService.listUnlocked(userId);
    const defs = await achievementService.listDefinitions();

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementKey, u]));
    const merged = defs.map((d) => ({
      ...d,
      unlockedAt: unlockedMap.get(d.key)?.unlockedAt ?? null,
    }));

    return ApiResponse.success(res, merged);
  }),
};