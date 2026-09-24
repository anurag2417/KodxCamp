import type { Response } from 'express';
import { z } from 'zod';
import { studentRosterService } from '../services/studentRoster.service.js';
import { Course } from '../models/Course.model.js';
import { permissions } from '../services/permissions.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const rosterQuerySchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({
    search: z.string().optional(),
    sort: z.enum(['recent', 'progress', 'name', 'joined']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const rosterStudentSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    userId: z.string().min(1),
  }),
});

async function assertCanViewStudents(
  req: AuthRequest,
  courseSlug: string
): Promise<string> {
  const user = {
    _id: req.user!._id.toString(),
    role: req.user!.role as string,
  };

  const course = await Course.findOne({ slug: courseSlug });
  if (!course) throw new ApiError(404, 'Course not found.');

  const role = await permissions.resolveEffectiveRole(
    user,
    course._id.toString()
  );

  if (!permissions.canViewStudents(role)) {
    throw new ApiError(403, 'You do not have permission to view students.');
  }

  return course._id.toString();
}

export const instructorStudentController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const courseId = await assertCanViewStudents(req, String(req.params.slug));

    const { search, sort, page, limit } = req.query as {
      search?: string;
      sort?: 'recent' | 'progress' | 'name' | 'joined';
      page?: number;
      limit?: number;
    };

    const result = await studentRosterService.list({
      courseId,
      search,
      sort,
      page,
      limit,
    });

    return ApiResponse.success(res, result);
  }),

  detail: asyncHandler(async (req: AuthRequest, res: Response) => {
    const courseId = await assertCanViewStudents(req, String(req.params.slug));

    const result = await studentRosterService.detail({
      courseId,
      userId: String(req.params.userId),
    });

    return ApiResponse.success(res, result);
  }),
};