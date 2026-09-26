import type { Response } from 'express';
import { z } from 'zod';
import { cohortService } from '../services/cohort.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/* ─── Schemas ────────────────────────────────────────────────────── */

const entityKindSchema = z.enum(['course', 'roadmap']);
const cohortRoleSchema = z.enum(['instructor', 'assistant', 'student']);

export const createCohortSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(150),
      slug: z
        .string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9-]+$/),
      description: z.string().max(1000).optional(),
      entityKind: entityKindSchema,
      entityId: z.string().min(1),
      startDate: z.string().max(40).optional(),
      endDate: z.string().max(40).optional(),
      displayOrder: z.number().int().optional(),
    })
    .strict(),
});

export const updateCohortSchema = z.object({
  params: z.object({ cohortId: z.string().min(1) }),
  body: z
    .object({
      name: z.string().min(2).max(150).optional(),
      slug: z
        .string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      description: z.string().max(1000).optional(),
      entityKind: entityKindSchema.optional(),
      entityId: z.string().min(1).optional(),
      startDate: z.string().max(40).optional(),
      endDate: z.string().max(40).optional(),
      displayOrder: z.number().int().optional(),
      archived: z.boolean().optional(),
    })
    .strict(),
});

export const cohortIdSchema = z.object({
  params: z.object({ cohortId: z.string().min(1) }),
});

export const setArchivedSchema = z.object({
  params: z.object({ cohortId: z.string().min(1) }),
  body: z.object({ archived: z.boolean() }),
});

export const addMemberSchema = z.object({
  params: z.object({ cohortId: z.string().min(1) }),
  body: z
    .object({
      userId: z.string().min(1),
      role: cohortRoleSchema,
    })
    .strict(),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    cohortId: z.string().min(1),
    userId: z.string().min(1),
  }),
  body: z.object({ role: cohortRoleSchema }),
});

export const memberParamsSchema = z.object({
  params: z.object({
    cohortId: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const listCohortsQuerySchema = z.object({
  query: z.object({
    includeArchived: z.coerce.boolean().optional(),
    forEntity: z.enum(['course', 'roadmap']).optional(),
    entityId: z.string().optional(),
  }),
});

/* ─── Controllers ────────────────────────────────────────────────── */

export const cohortController = {
  listMine: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const includeArchived = req.query.includeArchived === 'true';
    const cohorts = await cohortService.listForUser(userId, {
      includeArchived,
    });
    return ApiResponse.success(res, cohorts);
  }),

  getDetail: asyncHandler(async (req: AuthRequest, res: Response) => {
    const detail = await cohortService.getDetail(
      String(req.params.cohortId)
    );
    return ApiResponse.success(res, detail);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const created = await cohortService.create(req.body, userId);
    return ApiResponse.success(res, created, 'Cohort created', 201);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await cohortService.update(
      String(req.params.cohortId),
      req.body
    );
    return ApiResponse.success(res, updated, 'Cohort updated');
  }),

  setArchived: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await cohortService.setArchived(
      String(req.params.cohortId),
      req.body.archived
    );
    return ApiResponse.success(res, updated, 'Archive state updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cohortService.delete(String(req.params.cohortId));
    return ApiResponse.success(res, result, 'Cohort deleted');
  }),

  addMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const created = await cohortService.addMember({
      cohortId: String(req.params.cohortId),
      userId: req.body.userId,
      role: req.body.role,
      addedBy: userId,
    });
    return ApiResponse.success(res, created, 'Member added', 201);
  }),

  updateMemberRole: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await cohortService.updateMemberRole(
      String(req.params.cohortId),
      String(req.params.userId),
      req.body.role
    );
    return ApiResponse.success(res, updated, 'Role updated');
  }),

  removeMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cohortService.removeMember(
      String(req.params.cohortId),
      String(req.params.userId)
    );
    return ApiResponse.success(res, result, 'Member removed');
  }),
};

export const adminCohortController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const includeArchived = req.query.includeArchived === 'true';
    const forEntity = req.query.forEntity as 'course' | 'roadmap' | undefined;
    const entityId = req.query.entityId as string | undefined;

    if (forEntity && entityId) {
      const rows = await cohortService.listForEntity(forEntity, entityId);
      return ApiResponse.success(res, rows);
    }

    const rows = await cohortService.listAll({ includeArchived });
    return ApiResponse.success(res, rows);
  }),

  getDetail: asyncHandler(async (req: AuthRequest, res: Response) => {
    const detail = await cohortService.getDetail(
      String(req.params.cohortId)
    );
    return ApiResponse.success(res, detail);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const created = await cohortService.create(req.body, userId);
    return ApiResponse.success(res, created, 'Cohort created', 201);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await cohortService.update(
      String(req.params.cohortId),
      req.body
    );
    return ApiResponse.success(res, updated, 'Cohort updated');
  }),

  setArchived: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await cohortService.setArchived(
      String(req.params.cohortId),
      req.body.archived
    );
    return ApiResponse.success(res, updated, 'Archive state updated');
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cohortService.delete(String(req.params.cohortId));
    return ApiResponse.success(res, result, 'Cohort deleted');
  }),

  addMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const created = await cohortService.addMember({
      cohortId: String(req.params.cohortId),
      userId: req.body.userId,
      role: req.body.role,
      addedBy: userId,
    });
    return ApiResponse.success(res, created, 'Member added', 201);
  }),

  updateMemberRole: asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await cohortService.updateMemberRole(
      String(req.params.cohortId),
      String(req.params.userId),
      req.body.role
    );
    return ApiResponse.success(res, updated, 'Role updated');
  }),

  removeMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cohortService.removeMember(
      String(req.params.cohortId),
      String(req.params.userId)
    );
    return ApiResponse.success(res, result, 'Member removed');
  }),
};