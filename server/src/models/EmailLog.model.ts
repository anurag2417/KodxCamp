import mongoose, { Schema, type Document } from 'mongoose';

export type EmailTemplate =
  | 'otp'
  | 'invitation'
  | 'password-reset'
  | 'announcement'
  | 'digest';

export type EmailStatus = 'queued' | 'sent' | 'failed';

export interface IEmailLog {
  _id: string;
  to: string;
  template: EmailTemplate;
  subject: string;
  /**
   * The rendered HTML. Stored so retries don't need the original
   * template data. Excluded from default queries to avoid pulling
   * large blobs into list responses — retries request it explicitly
   * with `.select('+renderedHtml')`.
   */
  renderedHtml?: string;
  status: EmailStatus;
  attempts: number;
  lastError?: string;
  providerMessageId?: string;
  /** Optional reference to the entity that triggered the send. */
  refModel?: string;
  refId?: string;
  /** Set for queued sends. Cleared on success. */
  nextAttemptAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLogDocument extends Omit<IEmailLog, '_id'>, Document {}

const emailLogSchema = new Schema<EmailLogDocument>(
  {
    to: { type: String, required: true, index: true },
    template: {
      type: String,
      enum: ['otp', 'invitation', 'password-reset', 'announcement', 'digest'],
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    renderedHtml: { type: String, select: false },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed'],
      required: true,
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    providerMessageId: { type: String },
    refModel: { type: String },
    refId: { type: String, index: true },
    nextAttemptAt: { type: Date, index: true },
  },
  { timestamps: true }
);

emailLogSchema.index({ status: 1, nextAttemptAt: 1 });

export const EmailLog = mongoose.model<EmailLogDocument>(
  'EmailLog',
  emailLogSchema
);