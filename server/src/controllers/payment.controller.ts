import type { Request, Response } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service.js';
import { razorpayService } from '../services/razorpay.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const createOrderSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
  }),
});

export const verifyCheckoutSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    paymentId: z.string().min(1),
    signature: z.string().min(1),
  }),
});

export const enrollFreeSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
  }),
});

export const paymentController = {
  /**
   * GET /payments/config
   *
   * Public. Returns whether payments are enabled and (if so) the
   * public key id and mode. The key secret is never returned.
   */
  config: asyncHandler(async (_req: Request, res: Response) => {
    const configured = razorpayService.isConfigured();
    return ApiResponse.success(res, {
      configured,
      mode: process.env.RAZORPAY_MODE ?? 'test',
      keyId: configured ? process.env.RAZORPAY_KEY_ID : undefined,
    });
  }),

  /**
   * POST /payments/create-order
   */
  createOrder: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { courseId } = req.body;
    const order = await paymentService.createOrderForCourse({
      userId,
      courseId,
    });
    return ApiResponse.success(res, order, 'Order created', 201);
  }),

  /**
   * POST /payments/verify
   *
   * Client calls this after Razorpay Checkout succeeds. Signature is
   * verified server-side; enrollment is created on success.
   */
  verify: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { orderId, paymentId, signature } = req.body;
    const result = await paymentService.verifyCheckoutAndEnroll({
      userId,
      orderId,
      paymentId,
      signature,
    });
    return ApiResponse.success(res, result, 'Payment verified');
  }),

  /**
   * POST /payments/webhook
   *
   * Called by Razorpay, not by users. Signature is verified against the
   * raw request body. Mounted separately in `app.ts` with a raw body
   * parser, because the standard JSON parser would break signature
   * verification.
   */
  webhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.header('x-razorpay-signature') ?? '';
    if (!signature) {
      throw new ApiError(400, 'Missing webhook signature.');
    }

    const rawBody = (req as Request & { rawBody?: string }).rawBody;
    if (!rawBody) {
      throw new ApiError(
        500,
        'Webhook raw body was not captured. Check middleware order.'
      );
    }

    const result = await paymentService.handleWebhook({
      rawBody,
      signature,
      payload: req.body,
    });

    return ApiResponse.success(res, result, 'Webhook processed');
  }),

  /**
   * POST /payments/enroll-free
   *
   * Enroll in a free course without any payment.
   */
  enrollFree: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { courseId } = req.body;
    const result = await paymentService.enrollFree({ userId, courseId });
    return ApiResponse.success(
      res,
      result,
      result.alreadyEnrolled ? 'Already enrolled' : 'Enrolled'
    );
  }),
};