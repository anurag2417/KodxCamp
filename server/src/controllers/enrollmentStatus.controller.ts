import type { Response } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Enrollment status query.
 *
 * `GET /payments/enrollment-status?kind=course&id=<id>`
 *
 * Returns `{ enrolled: boolean }`. Used by `CourseDetail` and
 * `RoadmapDetail` to decide whether the primary CTA is "Enroll" or
 * "Continue". Previously the client inferred this from
 * `progressApi.getForCourse`, which always succeeds (it returns an
 * empty Progress object for non-enrolled users) and therefore always
 * reported `enrolled: true`.
 *
 * This endpoint is the correct primitive: it asks the payment
 * service — which owns enrollments — whether a row exists for the
 * (user, entity) pair.
 */
export const enrollmentStatusQuerySchema = z.object({
  query: z.object({
    kind: z.enum(['course', 'roadmap']),
    id: z.string().min(1),
  }),
});

export const enrollmentStatusController = {
  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const kind = req.query.kind as 'course' | 'roadmap';
    const id = req.query.id as string;
    const userId = req.user!._id.toString();

    if (!kind || !id) {
      throw new ApiError(400, 'kind and id are required');
    }

    const enrolled = await paymentService.isEnrolled(userId, kind, id);
    return ApiResponse.success(res, { enrolled });
  }),
};