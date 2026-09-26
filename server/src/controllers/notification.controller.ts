import type { Response } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notification.service.js';
import { notificationPreferenceService } from '../services/notificationPreference.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/* ─── Schemas ────────────────────────────────────────────────────── */

export const listNotificationsSchema = z.object({
  query: z.object({
    unread: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const updatePreferencesSchema = z.object({
  body: z
    .object({
      announcements: z.boolean().optional(),
      projectFeedback: z.boolean().optional(),
      submissions: z.boolean().optional(),
      teamInvites: z.boolean().optional(),
      cohortInvites: z.boolean().optional(),
      classes: z.boolean().optional(),
    })
    .strict(),
});

/* ─── Controllers ────────────────────────────────────────────────── */

export const notificationController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const unreadOnly = req.query.unread === 'true';
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await notificationService.listForUser(userId, {
      unreadOnly,
      page,
      limit,
    });

    return ApiResponse.success(res, result);
  }),

  unreadCount: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const count = await notificationService.unreadCount(userId);
    return ApiResponse.success(res, { count });
  }),

  markRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    await notificationService.markRead(userId, String(req.params.id));
    return ApiResponse.success(res, { ok: true });
  }),

  markAllRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    await notificationService.markAllRead(userId);
    return ApiResponse.success(res, { ok: true });
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    await notificationService.delete(userId, String(req.params.id));
    return ApiResponse.success(res, { ok: true });
  }),

  getPreferences: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const prefs = await notificationPreferenceService.getForUser(userId);
    return ApiResponse.success(res, prefs);
  }),

  updatePreferences: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const prefs = await notificationPreferenceService.update(
      userId,
      req.body,
    );
    return ApiResponse.success(res, prefs, 'Preferences updated');
  }),
};