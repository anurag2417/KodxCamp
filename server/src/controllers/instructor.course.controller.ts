import type { Response } from 'express';
import { z } from 'zod';
import { courseService } from '../services/course.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * One test-case shape. See `admin.problem.controller.ts` for the
 * semantics of `isHidden`.
 */
const testCaseSchema = z
  .object({
    input: z.string().default(''),
    expectedOutput: z.string().min(1, 'Expected output is required'),
    isHidden: z.boolean().default(false),
  })
  .strict();

const webChecksSchema = z
  .object({
    requiredHtml: z.array(z.string().min(1)).default([]),
    requiredCss: z.array(z.string().min(1)).default([]),
    requiredJs: z.array(z.string().min(1)).default([]),
  })
  .strict();

const starterFilesSchema = z
  .object({
    'index.html': z.string().default(''),
    'styles.css': z.string().default(''),
    'script.js': z.string().default(''),
  })
  .strict();

const webLessonStepSchema = z
  .object({
    title: z.string().min(1).max(150),
    instructions: z.string().min(1).max(5000),
    hint: z.string().max(1000).optional(),
    starterFiles: starterFilesSchema.default({
      'index.html': '',
      'styles.css': '',
      'script.js': '',
    }),
    webChecks: webChecksSchema.default({
      requiredHtml: [],
      requiredCss: [],
      requiredJs: [],
    }),
  })
  .strict();

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(120),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    description: z.string().min(5).max(1000),
    language: z.string().min(2),
    courseType: z.string().min(2).max(80).default('general'),
    thumbnail: z.string().optional(),
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(120).optional(),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().min(5).max(1000).optional(),
    language: z.string().min(2).optional(),
    courseType: z.string().min(2).max(80).optional(),
    thumbnail: z.string().optional(),
  }),
});

export const publishSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({ published: z.boolean() }),
});

export const courseSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const lessonSlugSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    lessonSlug: z.string().min(1),
  }),
});

export const createLessonSchema = z.object({
  params: z.object({ courseSlug: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(150),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    order: z.number().int().min(1).default(1),
    content: z.string().min(1),
    contentType: z.string().min(2).max(40).default('lesson'),
    starterCode: z.string().default(''),
    starterFiles: z.record(z.string()).optional(),
    webChecks: webChecksSchema.optional(),
    solution: z.string().default(''),
    problemSlug: z.string().min(1).optional(),
    functionName: z.string().min(1).default('solve'),
    outputMode: z.enum(['return', 'print']).default('print'),
    language: z.string().min(2),
    testCases: z.array(testCaseSchema).default([]),
    steps: z.array(webLessonStepSchema).default([]),
  }),
});

export const updateLessonSchema = z.object({
  params: z.object({
    courseSlug: z.string().min(1),
    lessonSlug: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    order: z.number().int().min(1).optional(),
    content: z.string().min(1).optional(),
    contentType: z.string().min(2).max(40).optional(),
    starterCode: z.string().optional(),
    starterFiles: z.record(z.string()).optional(),
    webChecks: webChecksSchema.optional(),
    solution: z.string().optional(),
    problemSlug: z.string().min(1).optional(),
    functionName: z.string().optional(),
    outputMode: z.enum(['return', 'print']).optional(),
    language: z.string().min(2).optional(),
    testCases: z.array(testCaseSchema).optional(),
    steps: z.array(webLessonStepSchema).optional(),
  }),
});

export const addTeamMemberSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    userId: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(['lead', 'author', 'reviewer', 'ta', 'viewer']),
  }),
});

export const updateTeamMemberSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    userId: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(['lead', 'author', 'reviewer', 'ta', 'viewer']),
  }),
});

export const teamMemberParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const instructorCourseController = {
  listMine: asyncHandler(async (req: AuthRequest, res: Response) => {
    const courses = await courseService.listForUser(req);
    return ApiResponse.success(res, courses);
  }),

  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await courseService.getFullForEditor(req, String(req.params.slug));
    return ApiResponse.success(res, data);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const created = await courseService.createCourse(req, req.body);
    return ApiResponse.success(res, created, 'Course created', 201);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await courseService.updateCourse(
      req,
      String(req.params.slug),
      req.body
    );
    return ApiResponse.success(res, updated, 'Course updated');
  }),

  setPublished: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await courseService.setPublished(
      req,
      String(req.params.slug),
      req.body.published
    );
    return ApiResponse.success(res, updated, 'Publish state updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await courseService.deleteCourse(req, String(req.params.slug));
    return ApiResponse.success(res, result, 'Course deleted');
  }),

  createLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    const created = await courseService.createLesson(
      req,
      String(req.params.courseSlug),
      req.body
    );
    return ApiResponse.success(res, created, 'Lesson created', 201);
  }),

  updateLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await courseService.updateLesson(
      req,
      String(req.params.courseSlug),
      String(req.params.lessonSlug),
      req.body
    );
    return ApiResponse.success(res, updated, 'Lesson updated');
  }),

  removeLesson: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await courseService.deleteLesson(
      req,
      String(req.params.courseSlug),
      String(req.params.lessonSlug)
    );
    return ApiResponse.success(res, result, 'Lesson deleted');
  }),

  listTeam: asyncHandler(async (req: AuthRequest, res: Response) => {
    const members = await courseService.listTeam(req, String(req.params.slug));
    return ApiResponse.success(res, members);
  }),

  addTeamMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const members = await courseService.addTeamMember(
      req,
      String(req.params.slug),
      String(req.params.userId),
      req.body.role
    );
    return ApiResponse.success(res, members, 'Team member added', 201);
  }),

  updateTeamMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const members = await courseService.updateTeamMemberRole(
      req,
      String(req.params.slug),
      String(req.params.userId),
      req.body.role
    );
    return ApiResponse.success(res, members, 'Team member role updated');
  }),

  removeTeamMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const members = await courseService.removeTeamMember(
      req,
      String(req.params.slug),
      String(req.params.userId)
    );
    return ApiResponse.success(res, members, 'Team member removed');
  }),
};