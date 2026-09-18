import type { Request, Response } from 'express';
import { z } from 'zod';
import { projectService } from '../services/project.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const projectSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

const fileSchema = z.object({
  name: z.string().min(1),
  language: z.string().min(1),
  content: z.string(),
  isEntry: z.boolean().optional(),
});

export const saveProjectSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    files: z.array(fileSchema).min(1),
  }),
});

export const projectController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const projects = await projectService.listAll(userId);
    return ApiResponse.success(res, projects);
  }),

  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const result = await projectService.getBySlug(req.params.slug, userId);
    return ApiResponse.success(res, result);
  }),

  start: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const result = await projectService.startOrGetUserProject(userId, req.params.slug);
    return ApiResponse.success(res, result);
  }),

  save: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const result = await projectService.saveUserProject(
      userId,
      req.params.slug,
      req.body.files
    );
    return ApiResponse.success(res, result, 'Project saved');
  }),

  complete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const result = await projectService.completeUserProject(userId, req.params.slug);
    return ApiResponse.success(res, result, 'Project completed');
  }),

  myProjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const list = await projectService.listUserProjects(userId);
    return ApiResponse.success(res, list);
  }),
};