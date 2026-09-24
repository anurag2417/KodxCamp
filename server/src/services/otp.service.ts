import { User } from '../models/User.model.js';
import { tokenService } from './token.service.js';
import { emailService } from './email.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * OTP-based signup.
 *
 * Three steps:
 *   1. `requestOtp(email)` - creates (or reuses) a pending user,
 *      generates a 6-digit code, emails it, and returns the user id.
 *   2. `verifyOtp(email, code)` - checks the code and moves the user
 *      from `pending_verification` to `pending_profile`. Returns a
 *      short-lived setup token.
 *   3. `setPassword(setupToken, name, password)` - completes the
 *      account. Sets the name and bcrypt password, marks it `active`,
 *      and issues the JWT.
 *
 * Once `emailVerified` is true, it never reverts. Existing users are
 * unaffected: their `emailVerified` is already true from the A1
 * migration.
 */
export const otpService = {
  /**
   * Step 1 - request an OTP for the given email.
   *
   * Behavior depends on whether the email already has a user:
   *
   *   - No user: create a `pending_verification` user.
   *   - User exists, `active`: refuse with `409 email_taken`.
   *     The client should show "sign in instead" or offer password
   *     reset.
   *   - User exists, `pending_verification`: resend the OTP. Do NOT
   *     create a second user.
   *   - User exists, `pending_profile`: refuse with
   *     `409 profile_pending`. The client should route to the setup
   *     screen, not the OTP screen. This shouldn't happen through
   *     normal use, but it's a safety net.
   *   - User exists, `suspended`: refuse with `403 account_suspended`.
   */
  async requestOtp(email: string): Promise<{ userId: string }> {
    const normalized = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalized });

    if (user) {
      if (user.accountStatus === 'active') {
        throw new ApiError(409, 'This email already has an account.');
      }
      if (user.accountStatus === 'suspended') {
        throw new ApiError(403, 'This account is suspended.');
      }
      if (user.accountStatus === 'pending_profile') {
        throw new ApiError(
          409,
          'This signup is already past email verification.'
        );
      }
      // pending_verification - resend the OTP.
    } else {
      user = await User.create({
        email: normalized,
        name: '',
        emailVerified: false,
        accountStatus: 'pending_verification',
        authProvider: 'email',
      });
    }

    // Generate a fresh OTP. This invalidates any previous one.
    const { raw, expiresAt } = await tokenService.generate(
      user._id.toString(),
      'otp-signup'
    );

    const ttlMinutes = Math.max(
      1,
      Math.round((expiresAt.getTime() - Date.now()) / 60_000)
    );

    // Fire-and-forget email. If it fails, the log row captures it and
    // the user can hit "resend".
    try {
      await emailService.send({
        to: normalized,
        template: 'otp',
        data: {
          code: raw,
          expiresInMinutes: ttlMinutes,
          purpose: 'finish signing up',
        },
        refModel: 'User',
        refId: user._id.toString(),
      });
    } catch (err) {
      logger.warn('OTP email failed to enqueue', {
        email: normalized,
        err: err instanceof Error ? err.message : String(err),
      });
      // Don't surface the email failure to the client - that would
      // leak SMTP health status. The user sees "check your email"
      // regardless. The dev env has EMAIL_ENABLED=false so the code
      // is logged in the server console.
    }

    // Dev convenience: if email is disabled, log the OTP so the
    // developer can copy it without opening Mailpit.
    if (!env.EMAIL_ENABLED && env.NODE_ENV !== 'production') {
      logger.info('OTP (dev, EMAIL_ENABLED=false)', {
        email: normalized,
        code: raw,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return { userId: user._id.toString() };
  },

  /**
   * Step 2 - verify the OTP.
   *
   * On success:
   *   - `emailVerified` becomes true.
   *   - `accountStatus` moves from `pending_verification` to
   *     `pending_profile`.
   *   - Returns a 5-minute setup token the client uses for step 3.
   */
  async verifyOtp(
    email: string,
    code: string
  ): Promise<{ setupToken: string }> {
    const normalized = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalized });
    if (!user) {
      throw new ApiError(400, 'Invalid code.');
    }
    if (user.accountStatus === 'suspended') {
      throw new ApiError(403, 'This account is suspended.');
    }
    if (user.accountStatus === 'active') {
      // They verified out-of-band. Treat as success but don't issue
      // a setup token - they should just log in.
      throw new ApiError(409, 'This account is already active.');
    }

    const result = await tokenService.consume(
      user._id.toString(),
      'otp-signup',
      code
    );

    if (!result.ok) {
      const message =
        result.reason === 'expired'
          ? 'This code has expired. Request a new one.'
          : result.reason === 'used'
            ? 'This code has already been used.'
            : result.reason === 'too_many_attempts'
              ? 'Too many attempts. Request a new code.'
              : 'Invalid code.';
      throw new ApiError(400, message);
    }

    user.emailVerified = true;
    if (user.accountStatus === 'pending_verification') {
      user.accountStatus = 'pending_profile';
    }
    await user.save();

    const setupToken = tokenService.issueSetupToken(user._id.toString());
    return { setupToken };
  },

  /**
   * Step 3 - set name and password, activate the account.
   *
   * The setup token proves the user just passed OTP verification.
   * Its 5-minute lifetime means an abandoned tab forces the user to
   * restart the OTP flow rather than hold onto a stale credential.
   */
  async setPassword(
    setupToken: string,
    name: string,
    password: string
  ): Promise<{ userId: string }> {
    const { userId } = tokenService.verifySetupToken(setupToken);

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }
    if (user.accountStatus === 'active') {
      throw new ApiError(409, 'This account is already active.');
    }
    if (user.accountStatus === 'suspended') {
      throw new ApiError(403, 'This account is suspended.');
    }
    if (!user.emailVerified) {
      // Shouldn't happen given the setup token issuance rules, but
      // refuse rather than create an unverified active user.
      throw new ApiError(400, 'Email verification is incomplete.');
    }

    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.default.hash(password, 12);

    user.name = name.trim();
    user.password = hashed;
    user.accountStatus = 'active';
    await user.save();

    return { userId: user._id.toString() };
  },

  /**
   * Resend an OTP. Same behavior as `requestOtp`, but always refuses
   * if the account is already past verification.
   */
  async resendOtp(email: string): Promise<void> {
    const normalized = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalized });
    if (!user) {
      // Don't leak whether the email exists. Silently succeed.
      return;
    }
    if (user.accountStatus === 'active') {
      throw new ApiError(409, 'This email already has an account.');
    }
    if (user.accountStatus === 'suspended') {
      throw new ApiError(403, 'This account is suspended.');
    }
    if (user.accountStatus === 'pending_profile') {
      throw new ApiError(
        409,
        'This signup is already past email verification.'
      );
    }

    // Reuse requestOtp to regenerate and send.
    await this.requestOtp(normalized);
  },
};