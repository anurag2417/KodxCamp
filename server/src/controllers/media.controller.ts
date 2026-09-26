import type { Response } from 'express';
import { z } from 'zod';
import { mediaService } from '../services/media.service.js';
import { storageService } from '../services/storage/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/* ─── Schemas ────────────────────────────────────────────────────── */

export const listMediaSchema = z.object({
  query: z.object({
    kind: z.enum(['image', 'video', 'audio', 'pdf', 'other']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    scope: z.enum(['mine', 'all']).optional(),
  }),
});

export const mediaIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

/* ─── Controllers ────────────────────────────────────────────────── */

export const mediaController = {
  upload: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'No file provided');
    }

    const userId = req.user!._id.toString();

    // Route the bytes through the storage façade. In production this
    // uploads to Cloudinary; in dev it writes to local disk. Either
    // way, the URL we get back is the canonical one — the controller
    // does not need to know which provider is active.
    //
    // As of Batch 2.4, multer uses memory storage for media uploads,
    // so `req.file.buffer` is always present.
    const stored = await storageService.saveMedia(req.file);

    const asset = await mediaService.recordUpload({
      ownerId: userId,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      stored: {
        url: stored.url,
        size: stored.size,
      },
    });

    return ApiResponse.success(res, asset, 'Asset uploaded', 201);
  }),

  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    const scope = (req.query.scope as 'mine' | 'all' | undefined) ?? 'mine';
    const kind = req.query.kind as
      | 'image'
      | 'video'
      | 'audio'
      | 'pdf'
      | 'other'
      | undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    if (scope === 'all' && !isAdmin) {
      throw new ApiError(403, 'Only admins can list all assets');
    }

    const result =
      scope === 'all'
        ? await mediaService.listAll({ kind, page, limit })
        : await mediaService.listForOwner(userId, { kind, page, limit });

    return ApiResponse.success(res, result);
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    const asset = await mediaService.getById(String(req.params.id));

    if (!isAdmin && asset.ownerId !== userId) {
      throw new ApiError(403, 'You do not own this asset');
    }

    return ApiResponse.success(res, asset);
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    const asset = await mediaService.getById(String(req.params.id));

    if (!isAdmin && asset.ownerId !== userId) {
      throw new ApiError(403, 'You do not own this asset');
    }

    const result = await mediaService.delete(String(req.params.id));
    return ApiResponse.success(res, result, 'Asset deleted');
  }),
};