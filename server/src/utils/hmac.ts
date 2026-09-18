import crypto from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Sign an arbitrary payload with HMAC-SHA256.
 * Used to ship hidden test cases to the client without letting them tamper.
 */
export function sign(payload: unknown): string {
  const json = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', env.HMAC_SECRET)
    .update(json)
    .digest('hex');
}

export function verify(payload: unknown, signature: string): boolean {
  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}