import { Course } from '../models/Course.model.js';
import { User } from '../models/User.model.js';
import { Payment } from '../models/Payment.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { razorpayService } from './razorpay.service.js';
import { logger } from '../utils/logger.js';

export const paymentService = {
  /**
   * Is this user already enrolled in this course?
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const existing = await StudentEnrollment.findOne({
      userId,
      courseId,
    }).lean();
    return Boolean(existing);
  },

  /**
   * Create a Razorpay order for a course purchase.
   *
   * Preconditions:
   *   - Course exists.
   *   - Course is paid (`isFree: false` and `price > 0`).
   *   - User is not already enrolled.
   *   - Razorpay is configured.
   *
   * Creates a Payment record with status `created` and returns the
   * order details for the client to hand to Razorpay Checkout.
   */
  async createOrderForCourse(input: {
    userId: string;
    courseId: string;
  }) {
    if (!razorpayService.isConfigured()) {
      throw new ApiError(
        503,
        'Payment is not configured on this server.'
      );
    }

    const course = await Course.findById(input.courseId).lean();
    if (!course) throw new ApiError(404, 'Course not found');
    if (course.isFree) {
      throw new ApiError(400, 'This course is free - enroll directly.');
    }
    if (!course.price || course.price <= 0) {
      throw new ApiError(
        400,
        'This course has no price set. Contact an admin.'
      );
    }

    const alreadyEnrolled = await this.isEnrolled(input.userId, input.courseId);
    if (alreadyEnrolled) {
      throw new ApiError(409, 'You are already enrolled in this course.');
    }

    const receipt = `rcpt_${input.userId.slice(-8)}_${Date.now()}`;
    const order = await razorpayService.createOrder({
      amount: course.price,
      currency: 'INR',
      receipt,
      notes: {
        courseId: input.courseId,
        userId: input.userId,
      },
    });

    await Payment.create({
      userId: input.userId,
      courseId: input.courseId,
      orderId: order.id,
      amount: course.price,
      currency: order.currency,
      status: 'created',
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      courseTitle: course.title,
    };
  },

  /**
   * Verify a checkout callback and create the enrollment.
   *
   * Called by the client after a successful Razorpay Checkout. Verifies
   * the signature, marks the Payment as captured, and creates a
   * StudentEnrollment row (idempotent).
   *
   * Both this and the webhook flow end up in `finalizePayment`, which
   * is idempotent. So it's safe for both to fire.
   */
  async verifyCheckoutAndEnroll(input: {
    userId: string;
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    const ok = razorpayService.verifyCheckoutSignature({
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: input.signature,
    });

    if (!ok) {
      // Signature mismatch: log it and fail closed. Do not touch the
      // payment record; the webhook (if it eventually fires with a
      // valid signature) can still finalize.
      logger.warn('Razorpay checkout signature mismatch', {
        orderId: input.orderId,
        userId: input.userId,
      });
      throw new ApiError(400, 'Payment verification failed.');
    }

    const payment = await Payment.findOne({ orderId: input.orderId });
    if (!payment) {
      throw new ApiError(404, 'Payment record not found for this order.');
    }
    if (payment.userId !== input.userId) {
      throw new ApiError(403, 'This payment does not belong to you.');
    }

    await this.finalizePayment({
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: input.signature,
      status: 'captured',
      source: 'checkout',
    });

    return { ok: true };
  },

  /**
   * Handle a Razorpay webhook. Verifies signature, then routes the
   * event to the appropriate finalization.
   *
   * Idempotent: the same event firing twice produces one enrollment.
   */
  async handleWebhook(input: {
    rawBody: string;
    signature: string;
    payload: {
      event: string;
      payload: {
        payment?: {
          entity?: {
            id: string;
            order_id: string;
            status: string;
          };
        };
      };
    };
  }) {
    const ok = razorpayService.verifyWebhookSignature({
      rawBody: input.rawBody,
      signature: input.signature,
    });
    if (!ok) {
      logger.warn('Razorpay webhook signature mismatch', {
        event: input.payload.event,
      });
      throw new ApiError(400, 'Webhook signature verification failed.');
    }

    const event = input.payload.event;
    const paymentEntity = input.payload.payload?.payment?.entity;

    if (!paymentEntity) {
      // Not a payment event we care about. Acknowledge and move on.
      return { ok: true, handled: false };
    }

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const rzpStatus = paymentEntity.status;

    if (!orderId) {
      return { ok: true, handled: false };
    }

    if (event === 'payment.captured') {
      await this.finalizePayment({
        orderId,
        paymentId,
        status: 'captured',
        source: 'webhook',
      });
      return { ok: true, handled: true };
    }

    if (event === 'payment.failed') {
      await Payment.updateOne(
        { orderId },
        { $set: { status: 'failed', paymentId } }
      );
      return { ok: true, handled: true };
    }

    // Log other events for observability but don't act on them.
    logger.info('Razorpay webhook event ignored', {
      event,
      rzpStatus,
    });
    return { ok: true, handled: false };
  },

  /**
   * Mark a Payment captured and ensure the enrollment exists.
   *
   * Idempotent. Safe to call from both the checkout flow and the
   * webhook, in any order, any number of times.
   */
  async finalizePayment(input: {
    orderId: string;
    paymentId?: string;
    signature?: string;
    status: 'captured';
    source: 'checkout' | 'webhook';
  }) {
    const payment = await Payment.findOne({ orderId: input.orderId });
    if (!payment) {
      logger.warn('finalizePayment: no payment record', {
        orderId: input.orderId,
        source: input.source,
      });
      return;
    }

    // Update the payment record if it's not already captured.
    if (payment.status !== 'captured') {
      payment.status = 'captured';
      if (input.paymentId) payment.paymentId = input.paymentId;
      if (input.signature) payment.signature = input.signature;
      await payment.save();
    }

    // Ensure the enrollment exists.
    await StudentEnrollment.updateOne(
      { userId: payment.userId, courseId: payment.courseId },
      {
        $setOnInsert: {
          userId: payment.userId,
          courseId: payment.courseId,
          joinedAt: new Date(),
          source: 'paid',
          paymentId: payment._id.toString(),
        },
      },
      { upsert: true }
    );

    logger.info('Payment finalized', {
      orderId: input.orderId,
      userId: payment.userId,
      courseId: payment.courseId,
      source: input.source,
    });
  },

  /**
   * Enroll a user in a free course. No payment involved.
   */
  async enrollFree(input: { userId: string; courseId: string }) {
    const course = await Course.findById(input.courseId).lean();
    if (!course) throw new ApiError(404, 'Course not found');
    if (!course.isFree) {
      throw new ApiError(400, 'This course is not free.');
    }

    const already = await this.isEnrolled(input.userId, input.courseId);
    if (already) {
      return { ok: true, alreadyEnrolled: true };
    }

    await StudentEnrollment.updateOne(
      { userId: input.userId, courseId: input.courseId },
      {
        $setOnInsert: {
          userId: input.userId,
          courseId: input.courseId,
          joinedAt: new Date(),
          source: 'manual',
        },
      },
      { upsert: true }
    );

    return { ok: true, alreadyEnrolled: false };
  },

  /**
   * Admin-only: enroll a user manually, no payment.
   */
  async adminEnroll(input: {
    userId: string;
    courseId: string;
    adminId: string;
  }) {
    const course = await Course.findById(input.courseId).lean();
    if (!course) throw new ApiError(404, 'Course not found');

    const user = await User.findById(input.userId).select('_id email').lean();
    if (!user) throw new ApiError(404, 'User not found');

    const already = await this.isEnrolled(input.userId, input.courseId);
    if (already) {
      return { ok: true, alreadyEnrolled: true };
    }

    await StudentEnrollment.updateOne(
      { userId: input.userId, courseId: input.courseId },
      {
        $setOnInsert: {
          userId: input.userId,
          courseId: input.courseId,
          joinedAt: new Date(),
          source: 'manual',
        },
      },
      { upsert: true }
    );

    logger.info('Admin manually enrolled a user', {
      adminId: input.adminId,
      userId: input.userId,
      courseId: input.courseId,
    });

    return { ok: true, alreadyEnrolled: false };
  },
};