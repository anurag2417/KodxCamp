import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, isRazorpayConfigured } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Razorpay SDK wrapper.
 *
 * The SDK is only instantiated when Razorpay is fully configured.
 * Every public method checks `isRazorpayConfigured()` first and
 * throws a 503 with a machine-readable reason if not. This keeps the
 * whole platform deployable without payment keys.
 */
let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, 'Payment is not configured on this server.');
  }
  if (client) return client;

  client = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID!,
    key_secret: env.RAZORPAY_KEY_SECRET!,
  });

  logger.info('Razorpay client initialized', {
    mode: env.RAZORPAY_MODE ?? 'test',
  });

  return client;
}

export interface CreateOrderInput {
  amount: number; // INR paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
}

export const razorpayService = {
  isConfigured(): boolean {
    return isRazorpayConfigured();
  },

  /**
   * Create a Razorpay order. Returns the raw order object.
   */
  async createOrder(input: CreateOrderInput): Promise<RazorpayOrder> {
    const rzp = getClient();
    try {
      const order = await rzp.orders.create({
        amount: input.amount,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes,
      });
      return order as unknown as RazorpayOrder;
    } catch (err) {
      logger.error('Razorpay order creation failed', {
        err: err instanceof Error ? err.message : String(err),
      });
      throw new ApiError(502, 'Could not reach the payment provider.');
    }
  },

  /**
   * Verify a Razorpay checkout callback signature.
   *
   * The payload signed by Razorpay is `<orderId>|<paymentId>` and the
   * signature is HMAC-SHA256 with the key secret.
   */
  verifyCheckoutSignature(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    if (!env.RAZORPAY_KEY_SECRET) return false;
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest('hex');
    return timingSafeEqualHex(expected, input.signature);
  },

  /**
   * Verify a Razorpay webhook signature.
   *
   * The payload signed is the raw request body as a string, and the
   * signature is HMAC-SHA256 with the webhook secret. The raw body is
   * critical — JSON parsing before this check will break verification.
   */
  verifyWebhookSignature(input: {
    rawBody: string;
    signature: string;
  }): boolean {
    if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(input.rawBody)
      .digest('hex');
    return timingSafeEqualHex(expected, input.signature);
  },
};

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}