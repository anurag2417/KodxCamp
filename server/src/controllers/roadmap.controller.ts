import type { Response } from 'express';
import { z } from 'zod';
import { roadmapService } from '../services/roadmap.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/* ─── Schemas ────────────────────────────────────────────────────── */

const courseRefSchema = z
  .object({
    courseId: z.string().min(1),
    order: z.number().int().min(1).optional(),
    isRequired: z.boolean().optional(),
  })
  .strict();

const featureSchema = z
  .object({
    icon: z.string().optional(),
    label: z.string().min(1),
  })
  .strict();

const sellingPointSchema = z
  .object({
    icon: z.string().optional(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
  })
  .strict();

const curriculumSchema = z
  .object({
    title: z.string().min(1),
    lessons: z.number().int().min(0),
    duration: z.string().optional(),
    items: z.array(z.string()).default([]),
  })
  .strict();

const instructorLinkSchema = z
  .object({
    label: z.string().min(1),
    url: z.string().url(),
  })
  .strict();

const instructorSchema = z
  .object({
    name: z.string().min(1),
    role: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    links: z.array(instructorLinkSchema).optional(),
  })
  .strict();

const faqSchema = z
  .object({
    question: z.string().min(1),
    answer: z.string().min(1),
  })
  .strict();

const projectSchema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    image: z.string().optional(),
  })
  .strict();

/* ─── Public ─────────────────────────────────────────────────────── */

export const roadmapSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

/* ─── Admin ──────────────────────────────────────────────────────── */

export const adminCreateRoadmapSchema = z.object({
  body: z
    .object({
      title: z.string().min(2).max(150),
      slug: z
        .string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9-]+$/),
      description: z.string().min(5).max(2000),
      tagline: z.string().max(200).optional(),
      tags: z.array(z.string()).optional(),
      badge: z
        .enum(['LIVE', 'NEW', 'POPULAR', 'STARTING SOON'])
        .optional(),
      thumbnail: z.string().optional(),
      heroVideoUrl: z.string().optional(),
      courses: z.array(courseRefSchema).optional(),
      isFree: z.boolean().optional(),
      price: z.number().int().min(0).optional(),
      originalPrice: z.number().int().min(0).optional(),
      features: z.array(featureSchema).optional(),
      sellingPoints: z.array(sellingPointSchema).optional(),
      sellingHeadline: z.string().optional(),
      learningOutcomes: z.array(z.string()).optional(),
      curriculum: z.array(curriculumSchema).optional(),
      projects: z.array(projectSchema).optional(),
      instructor: instructorSchema.optional(),
      certificateIncluded: z.boolean().optional(),
      faq: z.array(faqSchema).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
});

export const adminUpdateRoadmapSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z
    .object({
      title: z.string().min(2).max(150).optional(),
      slug: z
        .string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      description: z.string().min(5).max(2000).optional(),
      tagline: z.string().max(200).optional(),
      tags: z.array(z.string()).optional(),
      badge: z
        .enum(['LIVE', 'NEW', 'POPULAR', 'STARTING SOON'])
        .optional(),
      thumbnail: z.string().optional(),
      heroVideoUrl: z.string().optional(),
      courses: z.array(courseRefSchema).optional(),
      isFree: z.boolean().optional(),
      price: z.number().int().min(0).optional(),
      originalPrice: z.number().int().min(0).optional(),
      features: z.array(featureSchema).optional(),
      sellingPoints: z.array(sellingPointSchema).optional(),
      sellingHeadline: z.string().optional(),
      learningOutcomes: z.array(z.string()).optional(),
      curriculum: z.array(curriculumSchema).optional(),
      projects: z.array(projectSchema).optional(),
      instructor: instructorSchema.optional(),
      certificateIncluded: z.boolean().optional(),
      faq: z.array(faqSchema).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
});

export const adminSetPublishedSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({ published: z.boolean() }),
});

/* ─── Controllers ────────────────────────────────────────────────── */

export const roadmapController = {
  /** GET /roadmaps — public catalog */
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const roadmaps = await roadmapService.listPublished();
    return ApiResponse.success(res, roadmaps);
  }),

  /** GET /roadmaps/:slug — public detail */
  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = String(req.params.slug);
    const roadmap = await roadmapService.getBySlug(slug);
    return ApiResponse.success(res, roadmap);
  }),
};

export const adminRoadmapController = {
  /** GET /admin/roadmaps */
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const roadmaps = await roadmapService.listAllForAdmin();
    return ApiResponse.success(res, roadmaps);
  }),

  /** GET /admin/roadmaps/:slug */
  getFull: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = String(req.params.slug);
    const roadmap = await roadmapService.getFullBySlug(slug);
    return ApiResponse.success(res, roadmap);
  }),

  /** POST /admin/roadmaps */
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user!._id.toString();
    const created = await roadmapService.create(req.body, adminId);
    return ApiResponse.success(res, created, 'Roadmap created', 201);
  }),

  /** PATCH /admin/roadmaps/:slug */
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = String(req.params.slug);
    const updated = await roadmapService.update(slug, req.body);
    return ApiResponse.success(res, updated, 'Roadmap updated');
  }),

  /** PATCH /admin/roadmaps/:slug/publish */
  setPublished: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = String(req.params.slug);
    const updated = await roadmapService.setPublished(
      slug,
      req.body.published
    );
    return ApiResponse.success(res, updated, 'Publish state updated');
  }),

  /** DELETE /admin/roadmaps/:slug */
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = String(req.params.slug);
    const result = await roadmapService.delete(slug);
    return ApiResponse.success(res, result, 'Roadmap deleted');
  }),
};