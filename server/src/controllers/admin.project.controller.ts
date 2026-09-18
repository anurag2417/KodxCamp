import type { Response } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const fileSchema = z.object({
  name: z.string().min(1),
  language: z.enum(['html', 'css', 'javascript', 'jsx', 'sql', 'json', 'markdown']),
  content: z.string().default(''),
  isEntry: z.boolean().optional(),
});

export const projectBodySchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(80),
  description: z.string().min(5).max(500),
  longDescription: z.string().default(''),
  category: z.enum(['frontend', 'react', 'api', 'sql', 'dataviz', 'javascript']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string()).default([]),
  thumbnail: z.string().optional(),
  files: z.array(fileSchema).min(1),
  previewMode: z.enum(['html', 'react', 'sql', 'none']).default('html'),
  instructions: z.string().default(''),
  estimatedMinutes: z.number().int().min(5).max(600).default(60),
  xpReward: z.number().int().min(0).max(1000).default(100),
});

export const adminProjectController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const exists = await Project.findOne({ slug: req.body.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');
    const created = await Project.create(req.body);
    return ApiResponse.success(res, created.toObject(), 'Project created', 201);
  }),

  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await Project.findOne({ slug: req.params.slug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');
    return ApiResponse.success(res, project);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await Project.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new ApiError(404, 'Project not found');
    return ApiResponse.success(res, updated, 'Project updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await Project.deleteOne({ slug: req.params.slug });
    if (result.deletedCount === 0) throw new ApiError(404, 'Project not found');
    return ApiResponse.success(res, { ok: true }, 'Project deleted');
  }),
};