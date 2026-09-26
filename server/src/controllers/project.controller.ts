import type { Response } from 'express';
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

/**
 * A single test result. `check` is `unknown` — the client produced it
 * and the server stores it verbatim. We cap its serialized size.
 */
const testResultSchema = z.object({
  name: z.string().min(1),
  check: z.unknown(),
  passed: z.boolean(),
  actual: z.string(),
  message: z.string().optional(),
});

const testRunSchema = z.object({
  totalTests: z.number().int().min(0),
  passedTests: z.number().int().min(0),
  failedTests: z.number().int().min(0),
  allPassed: z.boolean(),
  durationMs: z.number().int().min(0),
  results: z.array(testResultSchema).max(500),
  ranAt: z.string().datetime().or(z.date()),
  error: z.string().optional(),
});

/**
 * A single screenshot. `dataUrl` is a base64 PNG data URL. We cap the
 * encoded size at ~500 KB per image — anything larger is rejected
 * with a clear error rather than blowing up Mongo's document size
 * limit or the client's request payload.
 *
 * The check is on `dataUrl.length`, which is the encoded string
 * length, not the decoded byte count. 500 KB encoded ≈ 375 KB raw.
 */
const MAX_SCREENSHOT_DATA_URL_LENGTH = 700_000;

const screenshotSchema = z.object({
  viewport: z.enum(['desktop', 'mobile']),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  dataUrl: z
    .string()
    .startsWith('data:image/png;base64,')
    .max(
      MAX_SCREENSHOT_DATA_URL_LENGTH,
      'Screenshot exceeds maximum allowed size'
    ),
});

const screenshotsSchema = z.object({
  desktop: screenshotSchema.optional(),
  mobile: screenshotSchema.optional(),
  error: z.string().optional(),
});

export const submitProjectSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    files: z.array(fileSchema).min(1).optional(),
    notes: z.string().max(2000).optional(),
    testRun: testRunSchema.optional(),
    screenshots: screenshotsSchema.optional(),
  }),
});

export const submissionParamsSchema = z.object({
  params: z.object({ submissionId: z.string().min(1) }),
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
    const result = await projectService.startOrGetUserProject(
      userId,
      req.params.slug
    );
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
    const result = await projectService.completeUserProject(
      userId,
      req.params.slug
    );
    return ApiResponse.success(res, result, 'Project completed');
  }),

  myProjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const list = await projectService.listUserProjects(userId);
    return ApiResponse.success(res, list);
  }),

  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const submission = await projectService.submitProject({
      userId,
      projectSlug: String(req.params.slug),
      files: req.body.files,
      notes: req.body.notes,
      testRun: req.body.testRun,
      screenshots: req.body.screenshots,
    });
    return ApiResponse.success(res, submission, 'Submission recorded', 201);
  }),

  submissions: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const list = await projectService.listSubmissions(
      userId,
      String(req.params.slug)
    );
    return ApiResponse.success(res, list);
  }),

  submission: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const sub = await projectService.getSubmission(
      userId,
      String(req.params.submissionId)
    );
    return ApiResponse.success(res, sub);
  }),
};