import type { Response } from 'express';
import { z } from 'zod';
import { classService } from '../services/class.service.js';
import { storageService } from '../services/storage.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const listClassesSchema = z.object({
  query: z.object({
    scope: z.enum(['upcoming', 'past', 'all']).optional(),
  }),
});

export const classSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const createClassSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(2000).default(''),
    scheduledAt: z.string().min(1),
    durationMinutes: z.number().int().min(5).max(480).default(60),
    meetLink: z.string().url('A valid Google Meet URL is required'),
    courseId: z.string().optional(),
  }),
});

export const updateClassSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().max(2000).optional(),
    scheduledAt: z.string().min(1).optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    meetLink: z.string().url().optional(),
    status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
  }),
});

export const watchProgressSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    watchedSeconds: z.number().min(0).max(86400),
    durationSec: z.number().min(0).max(86400),
  }),
});

export const classController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const scope =
      (req.query.scope as 'upcoming' | 'past' | 'all' | undefined) ?? 'all';
    const classes = await classService.list({ scope }, userId);
    return ApiResponse.success(res, classes);
  }),

  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const data = await classService.getBySlug(req.params.slug, userId);
    return ApiResponse.success(res, data);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    if (user.role !== 'instructor' && user.role !== 'admin') {
      throw new ApiError(403, 'Only instructors can create classes');
    }
    const created = await classService.create({
      ...req.body,
      instructor: { _id: user._id.toString(), name: user.name },
    });
    return ApiResponse.success(res, created, 'Class created', 201);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const updated = await classService.update(
      req.params.slug,
      user._id.toString(),
      req.body
    );
    return ApiResponse.success(res, updated, 'Class updated');
  }),

  enroll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await classService.enroll(
      req.params.slug,
      user._id.toString()
    );
    return ApiResponse.success(res, result, 'Enrolled');
  }),

  unenroll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await classService.unenroll(
      req.params.slug,
      user._id.toString()
    );
    return ApiResponse.success(res, result, 'Left class');
  }),

  attend: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await classService.markAttended(
      req.params.slug,
      user._id.toString()
    );
    return ApiResponse.success(res, result, 'Attendance recorded');
  }),

  watchProgress: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { watchedSeconds, durationSec } = req.body;
    const result = await classService.updateWatchProgress(
      req.params.slug,
      user._id.toString(),
      watchedSeconds,
      durationSec
    );
    return ApiResponse.success(res, result, 'Progress saved');
  }),

  myRecordings: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const list = await classService.listMyRecordings(user._id.toString());

    // Convert stored URLs to absolute URLs (respects PUBLIC_UPLOAD_BASE_URL)
    const withAbsolute = list.map((item) => ({
      ...item,
      class: {
        ...item.class,
        recording: item.class.recording
          ? {
              ...item.class.recording,
              url: storageService.toAbsoluteUrl(item.class.recording.url),
            }
          : undefined,
      },
    }));
    return ApiResponse.success(res, withAbsolute);
  }),

  uploadRecording: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    if (user.role !== 'instructor' && user.role !== 'admin') {
      throw new ApiError(403, 'Only instructors can upload recordings');
    }
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const { slug } = req.params;
    const durationSec = Number(req.body.durationSec ?? 0);

    // `req.file` is structurally compatible with RecordingUploadInput,
    // so no mapping step is needed. The local provider reads
    // `filename` + `path` when multer used disk storage; the
    // Cloudinary provider reads `buffer` when multer used memory
    // storage (Batch 2.3).
    const stored = await storageService.saveRecording(req.file);

    const updated = await classService.attachRecording(
      slug,
      user._id.toString(),
      {
        url: stored.url,
        durationSec,
        sizeBytes: stored.size,
      }
    );

    return ApiResponse.success(res, updated, 'Recording uploaded', 201);
  }),
};