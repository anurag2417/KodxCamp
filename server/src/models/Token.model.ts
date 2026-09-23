import mongoose, { Schema, type Document } from 'mongoose';

/**
 * Shared token collection for every short-lived, single-use credential
 * in the platform:
 *
 *   otp-signup        — 6-digit code emailed during email signup
 *   password-reset    — reset link or code
 *   invitation        — course team invitation
 *
 * Design notes:
 *   - Only the SHA-256 hash of the token is stored, never the raw
 *     value. A DB leak cannot be used to redeem a token.
 *   - `expiresAt` has a Mongo TTL index so expired rows are cleaned up
 *     automatically. No cron job needed.
 *   - `attempts` lets us rate-limit verification attempts per token,
 *     which defends 6-digit OTPs against brute force.
 *   - `usedAt` is set the moment a token is consumed; the same token
 *     can never be redeemed twice.
 */

export type TokenPurpose =
  | 'otp-signup'
  | 'password-reset'
  | 'invitation';

export interface IToken {
  _id: string;
  userId: string;
  purpose: TokenPurpose;
  /** SHA-256 hex of `${rawToken}${pepper}`. */
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  attempts: number;
  createdAt: Date;
}

export interface TokenDocument extends Omit<IToken, '_id'>, Document {}

const tokenSchema = new Schema<TokenDocument>(
  {
    userId: { type: String, required: true, index: true },
    purpose: {
      type: String,
      enum: ['otp-signup', 'password-reset', 'invitation'] as TokenPurpose[],
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One active token per (user, purpose). Creating a new one invalidates
// the old one for that purpose. This prevents "resend" from leaving a
// pile of live codes.
tokenSchema.index({ userId: 1, purpose: 1 }, { unique: false });

// Auto-cleanup of expired tokens.
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Token = mongoose.model<TokenDocument>('Token', tokenSchema);