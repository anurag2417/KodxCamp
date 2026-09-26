import { Course } from '../models/Course.model.js';
import { Roadmap } from '../models/Roadmap.model.js';
import { User } from '../models/User.model.js';
import { Payment } from '../models/Payment.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { Cohort } from '../models/Cohort.model.js';
import { ApiError } from '../utils/ApiError.js';
import { razorpayService } from './razorpay.service.js';
import { logger } from '../utils/logger.js';

type EntityKind = 'course' | 'roadmap';

async function loadPaidEntity(
  kind: EntityKind,
  id: string
): Promise<{
  title: string;
  price: number;
  isFree: boolean;
}> {
  const doc =
    kind === 'course'
      ? await Course.findById(id).select('title isFree price').lean()
      : await Roadmap.findById(id).select('title isFree price').lean();

  if (!doc) {
    throw new ApiError(404, `${kind === 'course' ? 'Course' : 'Roadmap'} not found`);
  }

  return {
    title: doc.title,
    price: doc.price ?? 0,
    isFree: doc.isFree,
  };
}

/**
 * Verify a cohort id, if provided, and check that it matches the
 * target entity. A cohort of a different course cannot be used to
 * enroll in this one.
 */
async function validateCohort(
  cohortId: string | undefined,
  entityKind: EntityKind,
  entityId: string
): Promise<void> {
  if (!cohortId) return;
  const cohort = await Cohort.findById(cohortId)
    .select('entityKind entityId archived')
    .lean();
  if (!cohort) throw new ApiError(404, 'Cohort not found');
  if (cohort.archived) {
    throw new ApiError(400, 'That cohort is archived.');
  }
  if (
    cohort.entityKind !== entityKind ||
    cohort.entityId !== entityId
  ) {
    throw new ApiError(
      400,
      'That cohort does not belong to this course or roadmap.'
    );
  }
}

export const paymentService = {
  async isEnrolled(
    userId: string,
    kind: EntityKind,
    id: string
  ): Promise<boolean> {
    const query =
      kind === 'course'
        ? { userId, courseId: id }
        : { userId, roadmapId: id };
    const existing = await StudentEnrollment.findOne(query).lean();
    return Boolean(existing);
  },

  async createOrder(input: {
    userId: string;
    kind: EntityKind;
    id: string;
  }) {
    if (!razorpayService.isConfigured()) {
      throw new ApiError(503, 'Payment is not configured on this server.');
    }

    const entity = await loadPaidEntity(input.kind, input.id);

    if (entity.isFree) {
      throw new ApiError(400, 'This is free — enroll directly.');
    }
    if (!entity.price || entity.price <= 0) {
      throw new ApiError(400, 'This has no price set. Contact an admin.');
    }

    const alreadyEnrolled = await this.isEnrolled(
      input.userId,
      input.kind,
      input.id
    );
    if (alreadyEnrolled) {
      throw new ApiError(409, 'You are already enrolled.');
    }

    const receipt = `rcpt_${input.userId.slice(-8)}_${Date.now()}`;
    const order = await razorpayService.createOrder({
      amount: entity.price,
      currency: 'INR',
      receipt,
      notes: {
        kind: input.kind,
        entityId: input.id,
        userId: input.userId,
      },
    });

    await Payment.create({
      userId: input.userId,
      courseId: input.kind === 'course' ? input.id : undefined,
      roadmapId: input.kind === 'roadmap' ? input.id : undefined,
      orderId: order.id,
      amount: entity.price,
      currency: order.currency,
      status: 'created',
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      title: entity.title,
    };
  },

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

    logger.info('Razorpay webhook event ignored', {
      event,
      rzpStatus,
    });
    return { ok: true, handled: false };
  },

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

    if (payment.status !== 'captured') {
      payment.status = 'captured';
      if (input.paymentId) payment.paymentId = input.paymentId;
      if (input.signature) payment.signature = input.signature;
      await payment.save();
    }

    const query = payment.roadmapId
      ? { userId: payment.userId, roadmapId: payment.roadmapId }
      : { userId: payment.userId, courseId: payment.courseId };

    const insert = payment.roadmapId
      ? {
          userId: payment.userId,
          roadmapId: payment.roadmapId,
          joinedAt: new Date(),
          source: 'paid' as const,
          paymentId: payment._id.toString(),
        }
      : {
          userId: payment.userId,
          courseId: payment.courseId,
          joinedAt: new Date(),
          source: 'paid' as const,
          paymentId: payment._id.toString(),
        };

    await StudentEnrollment.updateOne(
      query,
      { $setOnInsert: insert },
      { upsert: true }
    );

    logger.info('Payment finalized', {
      orderId: input.orderId,
      userId: payment.userId,
      courseId: payment.courseId,
      roadmapId: payment.roadmapId,
      source: input.source,
    });
  },

  /**
   * Enroll a user in a free entity. Optionally attach to a cohort.
   */
  async enrollFree(input: {
    userId: string;
    kind: EntityKind;
    id: string;
    cohortId?: string;
  }) {
    const entity = await loadPaidEntity(input.kind, input.id);
    if (!entity.isFree) {
      throw new ApiError(400, 'This is not free.');
    }

    await validateCohort(input.cohortId, input.kind, input.id);

    const already = await this.isEnrolled(input.userId, input.kind, input.id);
    if (already) {
      // If the user is already enrolled and a cohort was provided,
      // move their enrollment into that cohort.
      if (input.cohortId) {
        const query =
          input.kind === 'course'
            ? { userId: input.userId, courseId: input.id }
            : { userId: input.userId, roadmapId: input.id };
        await StudentEnrollment.updateOne(query, {
          $set: { cohortId: input.cohortId },
        });
      }
      return { ok: true, alreadyEnrolled: true };
    }

    const query =
      input.kind === 'course'
        ? { userId: input.userId, courseId: input.id }
        : { userId: input.userId, roadmapId: input.id };

    const insert =
      input.kind === 'course'
        ? {
            userId: input.userId,
            courseId: input.id,
            cohortId: input.cohortId,
            joinedAt: new Date(),
            source: 'manual' as const,
          }
        : {
            userId: input.userId,
            roadmapId: input.id,
            cohortId: input.cohortId,
            joinedAt: new Date(),
            source: 'manual' as const,
          };

    await StudentEnrollment.updateOne(
      query,
      { $setOnInsert: insert },
      { upsert: true }
    );

    return { ok: true, alreadyEnrolled: false };
  },

  /**
   * Admin-only: enroll a user manually. Optionally attach to a cohort.
   */
  async adminEnroll(input: {
    userId: string;
    kind: EntityKind;
    id: string;
    cohortId?: string;
    adminId: string;
  }) {
    const entity = await loadPaidEntity(input.kind, input.id);
    void entity;

    const user = await User.findById(input.userId).select('_id email').lean();
    if (!user) throw new ApiError(404, 'User not found');

    await validateCohort(input.cohortId, input.kind, input.id);

    const already = await this.isEnrolled(input.userId, input.kind, input.id);
    if (already) {
      if (input.cohortId) {
        const query =
          input.kind === 'course'
            ? { userId: input.userId, courseId: input.id }
            : { userId: input.userId, roadmapId: input.id };
        await StudentEnrollment.updateOne(query, {
          $set: { cohortId: input.cohortId },
        });
      }
      return { ok: true, alreadyEnrolled: true };
    }

    const query =
      input.kind === 'course'
        ? { userId: input.userId, courseId: input.id }
        : { userId: input.userId, roadmapId: input.id };

    const insert =
      input.kind === 'course'
        ? {
            userId: input.userId,
            courseId: input.id,
            cohortId: input.cohortId,
            joinedAt: new Date(),
            source: 'manual' as const,
          }
        : {
            userId: input.userId,
            roadmapId: input.id,
            cohortId: input.cohortId,
            joinedAt: new Date(),
            source: 'manual' as const,
          };

    await StudentEnrollment.updateOne(
      query,
      { $setOnInsert: insert },
      { upsert: true }
    );

    logger.info('Admin manually enrolled a user', {
      adminId: input.adminId,
      userId: input.userId,
      kind: input.kind,
      id: input.id,
      cohortId: input.cohortId,
    });

    return { ok: true, alreadyEnrolled: false };
  },
};