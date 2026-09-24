import mongoose, { Schema, type Document } from 'mongoose';

/**
 * Razorpay payment lifecycle.
 *
 *   created     -> order was created, no payment yet
 *   authorized  -> payment authorized by Razorpay (rare in the simple
 *                  checkout flow; most payments go straight to captured)
 *   captured    -> payment succeeded and funds are captured
 *   failed      -> payment attempt failed
 *   refunded    -> refunded by admin (out of scope for v1)
 */
export type PaymentStatus =
  | 'created'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded';

export interface PaymentDocument extends Document {
  /** Mongo user id of the buyer. */
  userId: string;
  /** Mongo course id. */
  courseId: string;
  /** Razorpay order id (`order_xxx`). Unique. */
  orderId: string;
  /** Razorpay payment id (`pay_xxx`), set once a payment attempt exists. */
  paymentId?: string;
  /** Razorpay signature from the checkout callback, if provided. */
  signature?: string;
  /** Amount in INR paise. Copied at order-creation time. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  /** Free-form: raw webhook payload, error messages, etc. */
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, index: true, sparse: true },
    signature: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, courseId: 1, createdAt: -1 });

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema);