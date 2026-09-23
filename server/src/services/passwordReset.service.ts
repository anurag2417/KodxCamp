import bcrypt from 'bcryptjs';
import { User } from '../models/User.model.js';
import { tokenService } from './token.service.js';
import { emailService } from './email.service.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Password reset.
 *
 * Two steps:
 *   1. `request(email)` — if the email belongs to a user, generate a
 *      single-use reset token and email a link. Always returns
 *      success, even when the email doesn't exist, to prevent account
 *      enumeration.
 *   2. `consume(token, newPassword)` — verify the token, hash the new
 *      password, save it, invalidate every other outstanding token
 *      for the user.
 *
 * Tokens are managed through `tokenService` and stored in the shared
 * `Token` collection, which already handles hashing, expiry, single
 * use, and TTL cleanup.
 *
 * Token format: for `password-reset`, `tokenService.generateRaw`
 * prepends the user id to the random suffix (`<userId>.<random>`).
 * That lets the reset page identify the user without a preflight
 * request. The stored hash covers the whole token, so a mismatch on
 * either half fails verification.
 */
export const passwordResetService = {
  /**
   * Step 1 — request a reset link.
   *
   * Silent on unknown emails. The caller always responds with the
   * same neutral message so an attacker can't use this endpoint to
   * check whether an email is registered.
   */
  async request(email: string): Promise<void> {
    const normalized = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalized });

    if (!user) {
      logger.debug('Password reset requested for unknown email', {
        email: normalized,
      });
      return;
    }

    if (user.accountStatus === 'suspended') {
      logger.warn('Password reset requested for suspended account', {
        userId: user._id.toString(),
      });
      return;
    }

    // `tokenService.generate` refuses if a token for this
    // (user, purpose) was created in the last 30 seconds. Swallow
    // that here so the caller doesn't leak its existence.
    let raw: string;
    let expiresAt: Date;
    try {
      const generated = await tokenService.generate(
        user._id.toString(),
        'password-reset'
      );
      raw = generated.raw;
      expiresAt = generated.expiresAt;
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 429) {
        return;
      }
      throw err;
    }

    const ttlMinutes = Math.max(
      1,
      Math.round((expiresAt.getTime() - Date.now()) / 60_000)
    );

    const resetUrl = `${env.CLIENT_URL[0]}/reset-password/${encodeURIComponent(raw)}`;

    try {
      await emailService.send({
        to: user.email,
        template: 'password-reset',
        data: { resetUrl, expiresInMinutes: ttlMinutes },
        refModel: 'User',
        refId: user._id.toString(),
      });
    } catch (err) {
      logger.warn('Password reset email failed to send', {
        email: normalized,
        err: err instanceof Error ? err.message : String(err),
      });
    }

    if (!env.EMAIL_ENABLED && env.NODE_ENV !== 'production') {
      logger.info('Password reset link (dev, EMAIL_ENABLED=false)', {
        email: normalized,
        resetUrl,
        expiresAt: expiresAt.toISOString(),
      });
    }
  },

  /**
   * Step 2 — consume a reset token and set a new password.
   *
   * Returns the user id so the controller can log them in
   * immediately.
   *
   * Side effects:
   *   - New bcrypt hash stored on the user.
   *   - Every other active token for this user is deleted, so an
   *     intercepted reset link can't be reused.
   *   - `authProvider` is preserved. A Google-linked user who sets an
   *     email password becomes `both`; a pure-email user stays
   *     `email`.
   *   - If the account was mid-signup, it becomes active.
   */
  async consume(
    token: string,
    newPassword: string
  ): Promise<{ userId: string }> {
    const dot = token.indexOf('.');
    if (dot <= 0) {
      throw new ApiError(400, 'This reset link is invalid or has expired.');
    }
    const userId = token.slice(0, dot);

    const result = await tokenService.consume(
      userId,
      'password-reset',
      token
    );

    if (!result.ok) {
      const message =
        result.reason === 'expired'
          ? 'This reset link has expired. Request a new one.'
          : result.reason === 'used'
            ? 'This reset link has already been used.'
            : result.reason === 'too_many_attempts'
              ? 'Too many attempts. Request a new reset link.'
              : 'This reset link is invalid or has expired.';
      throw new ApiError(400, message);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, 'This reset link is invalid or has expired.');
    }
    if (user.accountStatus === 'suspended') {
      throw new ApiError(403, 'This account is suspended.');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;

    // Adding a password to a Google-only account makes it `both`.
    if (user.authProvider === 'google') {
      user.authProvider = 'both';
    }

    // A reset proves control of the email. If the account was still
    // mid-signup, complete it now.
    if (
      user.accountStatus === 'pending_verification' ||
      user.accountStatus === 'pending_profile'
    ) {
      user.emailVerified = true;
      user.accountStatus = 'active';
    }

    await user.save();

    // Invalidate every other outstanding token for this user.
    await tokenService.purgeForUser(userId);

    return { userId: user._id.toString() };
  },
};