import type { Response } from 'express';
import { z } from 'zod';
import { Course } from '../models/Course.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { User } from '../models/User.model.js';
import { paymentService } from '../services/payment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const setCoursePricingSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    isFree: z.boolean(),
    /**
     * Price in INR paise. Required and > 0 when `isFree` is false.
     * Ignored when `isFree` is true.
     */
    price: z.number().int().min(0).optional(),
  }),
});

export const adminEnrollSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    userId: z.string().min(1),
  }),
});

export const listEnrollmentsSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const adminEnrollmentController = {
  /**
   * PATCH /admin/courses/:slug/pricing
   *
   * Set a course free or paid. Admin-only.
   *
   * Rules:
   *   - isFree: true   -> price cleared.
   *   - isFree: false  -> price required and > 0.
   */
  setPricing: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) throw new ApiError(404, 'Course not found');

    const { isFree, price } = req.body;

    if (isFree) {
      course.isFree = true;
      course.price = undefined;
    } else {
      if (!price || price <= 0) {
        throw new ApiError(
          400,
          'A positive price is required when the course is not free.'
        );
      }
      course.isFree = false;
      course.price = price;
    }

    await course.save();
    return ApiResponse.success(res, course.toObject(), 'Course pricing updated');
  }),

  /**
   * POST /admin/courses/:slug/enroll
   *
   * Enroll a user in a course without payment. Useful for support
   * scenarios, comping a course, or invited cohorts.
   */
  enroll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await Course.findOne({ slug: req.params.slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const { userId } = req.body;
    const adminId = req.user!._id.toString();

    const result = await paymentService.adminEnroll({
      userId,
      courseId: course._id.toString(),
      adminId,
    });
    return ApiResponse.success(
      res,
      result,
      result.alreadyEnrolled ? 'Already enrolled' : 'Enrolled'
    );
  }),

  /**
   * GET /admin/courses/:slug/enrollments
   *
   * Roster of who is enrolled, with their source and join date.
   */
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await Course.findOne({ slug: req.params.slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const enrollments = await StudentEnrollment.find({
      courseId: course._id.toString(),
    })
      .sort({ joinedAt: -1 })
      .lean();

    const userIds = enrollments.map((e) => e.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email avatar')
      .lean();
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return ApiResponse.success(
      res,
      enrollments.map((e) => ({
        _id: e._id,
        userId: e.userId,
        name: userById.get(e.userId)?.name ?? '(unknown)',
        email: userById.get(e.userId)?.email ?? '',
        avatar: userById.get(e.userId)?.avatar,
        joinedAt: e.joinedAt,
        source: e.source,
      }))
    );
  }),

  /**
   * DELETE /admin/courses/:slug/enrollments/:userId
   *
   * Revoke an enrollment. Does not refund payments.
   */
  revoke: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await Course.findOne({ slug: req.params.slug }).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const result = await StudentEnrollment.deleteOne({
      courseId: course._id.toString(),
      userId: req.params.userId,
    });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Enrollment not found');
    }
    return ApiResponse.success(res, { ok: true }, 'Enrollment revoked');
  }),
};