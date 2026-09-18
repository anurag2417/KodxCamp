import type { Response } from 'express';
import { z } from 'zod';
import { Class as ClassModel } from '../models/Class.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const updateClassAdminSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().max(2000).optional(),
    scheduledAt: z.string().optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    meetLink: z.string().url().optional(),
    status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
  }),
});

export const adminClassController = {
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const rows = await ClassModel.find().sort({ scheduledAt: -1 }).lean();
    return ApiResponse.success(res, rows);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { slug } = req.params;
    const patch = { ...req.body };
    if (patch.scheduledAt) patch.scheduledAt = new Date(patch.scheduledAt);

    const updated = await ClassModel.findOneAndUpdate({ slug }, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new ApiError(404, 'Class not found');
    return ApiResponse.success(res, updated, 'Class updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ClassModel.deleteOne({ slug: req.params.slug });
    if (result.deletedCount === 0) throw new ApiError(404, 'Class not found');
    return ApiResponse.success(res, { ok: true }, 'Class deleted');
  }),
};