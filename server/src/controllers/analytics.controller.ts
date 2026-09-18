import type { Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { activityService } from '../services/activity.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const analyticsController = {
  overview: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const data = await analyticsService.overview(userId);
    return ApiResponse.success(res, data);
  }),

  perCourse: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const data = await analyticsService.perCourse(userId);
    return ApiResponse.success(res, data);
  }),

  difficulty: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const data = await analyticsService.difficultyBreakdown(userId);
    return ApiResponse.success(res, data);
  }),

  weekly: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const weeks = Math.max(1, Math.min(52, Number(req.query.weeks ?? 12)));
    const data = await analyticsService.weekly(userId, weeks);
    return ApiResponse.success(res, data);
  }),

  recentActivity: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const data = await analyticsService.recentActivity(userId, 20);
    return ApiResponse.success(res, data);
  }),

  heatmap: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const days = Math.max(30, Math.min(400, Number(req.query.days ?? 365)));
    const data = await activityService.heatmap(userId, days);
    return ApiResponse.success(res, data);
  }),
};