import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Token, type TokenPurpose } from '../models/Token.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_ATTEMPTS = 5;

export interface GeneratedToken {
  raw: string;
  expiresAt: Date;
}

export interface VerifyResult {
  ok: boolean;
  userId?: string;
  reason?: 'expired' | 'used' | 'invalid' | 'too_many_attempts';
}

const TTL_BY_PURPOSE: Record<TokenPurpose, number> = {
  'otp-signup': 10 * 60 * 1000,
  'password-reset': 30 * 60 * 1000,
  invitation: 7 * 24 * 60 * 60 * 1000,
};

function isNumericPurpose(purpose: TokenPurpose): boolean {
  return purpose === 'otp-signup';
}

function generateRaw(purpose: TokenPurpose, userId?: string): string {
  if (isNumericPurpose(purpose)) {
    const n = crypto.randomInt(0, 1_000_000);
    return n.toString().padStart(6, '0');
  }
  const random = crypto.randomBytes(32).toString('base64url');
  // Password-reset tokens embed the user id so the reset page can
  // look up the token without a preflight request. The user id is
  // not secret — it's already exposed elsewhere.
  if (purpose === 'password-reset' && userId) {
    return `${userId}.${random}`;
  }
  return random;
}

function hashToken(raw: string): string {
  return crypto
    .createHash('sha256')
    .update(`${raw}${env.AUTH_PEPPER}`)
    .digest('hex');
}

export const tokenService = {
  async generate(
    userId: string,
    purpose: TokenPurpose
  ): Promise<GeneratedToken> {
    const recent = await Token.findOne({ userId, purpose })
      .sort({ createdAt: -1 })
      .lean();

    if (recent) {
      const ageMs = Date.now() - new Date(recent.createdAt).getTime();
      if (ageMs < 30_000) {
        throw new ApiError(
          429,
          'Please wait before requesting another code.'
        );
      }
    }

    await Token.deleteMany({ userId, purpose });

    const raw = generateRaw(purpose, userId);
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + TTL_BY_PURPOSE[purpose]);

    await Token.create({
      userId,
      purpose,
      tokenHash,
      expiresAt,
      attempts: 0,
    });

    return { raw, expiresAt };
  },

  async verify(
    userId: string,
    purpose: TokenPurpose,
    raw: string
  ): Promise<VerifyResult> {
    const token = await Token.findOne({ userId, purpose });

    if (!token) {
      return { ok: false, reason: 'invalid' };
    }
    if (token.usedAt) {
      return { ok: false, reason: 'used' };
    }
    if (token.expiresAt.getTime() < Date.now()) {
      return { ok: false, reason: 'expired' };
    }
    if (token.attempts >= MAX_ATTEMPTS) {
      await Token.deleteOne({ _id: token._id });
      return { ok: false, reason: 'too_many_attempts' };
    }

    const expectedHash = token.tokenHash;
    const actualHash = hashToken(raw);

    const a = Buffer.from(expectedHash, 'hex');
    const b = Buffer.from(actualHash, 'hex');
    const equal = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!equal) {
      await Token.updateOne(
        { _id: token._id },
        { $inc: { attempts: 1 } }
      );
      return { ok: false, reason: 'invalid' };
    }

    return { ok: true, userId: token.userId };
  },

  async consume(
    userId: string,
    purpose: TokenPurpose,
    raw: string
  ): Promise<VerifyResult> {
    const result = await this.verify(userId, purpose, raw);
    if (!result.ok) return result;

    await Token.updateOne(
      { userId, purpose, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    );

    return result;
  },

  async purgeForUser(userId: string): Promise<void> {
    await Token.deleteMany({ userId });
  },

  issueSetupToken(userId: string): string {
    return jwt.sign({ sub: userId, purpose: 'setup' }, env.SETUP_TOKEN_SECRET, {
      expiresIn: '5m',
    });
  },

  verifySetupToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, env.SETUP_TOKEN_SECRET) as {
        sub: string;
        purpose: string;
      };
      if (decoded.purpose !== 'setup') {
        throw new ApiError(401, 'Invalid setup token');
      }
      return { userId: decoded.sub };
    } catch {
      throw new ApiError(401, 'Invalid or expired setup token');
    }
  },
};