import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, type UserDocument } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { activityService } from './activity.service.js';
import { tokenService } from './token.service.js';

interface LoginInput {
  email: string;
  password: string;
}

/**
 * Login outcome. Success carries the user and token. Failure carries
 * a machine-readable `reason` so the client can decide what to render.
 */
export type LoginResult =
  | {
      ok: true;
      user: ReturnType<typeof sanitize>;
      accessToken: string;
    }
  | {
      ok: false;
      reason:
        | 'invalid_credentials'
        | 'email_unverified'
        | 'profile_incomplete'
        | 'account_suspended';
      /** Only present when reason === 'profile_incomplete'. */
      setupToken?: string;
      /** Only present when reason === 'email_unverified'. */
      email?: string;
    };

const signToken = (id: string): string =>
  jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

export const authService = {
  /**
   * Attempt a login. Returns a discriminated result so the controller
   * can respond with the right HTTP status and body.
   *
   * The password is verified before the account-status check. This is
   * deliberate: we don't want an attacker to learn that an email is
   * registered but unverified by trying random passwords. If the
   * password is wrong, they get the same response as a nonexistent
   * account.
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const email = input.email.toLowerCase().trim();

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return { ok: false, reason: 'invalid_credentials' };
    }

    const passwordOk = await bcrypt.compare(input.password, user.password);
    if (!passwordOk) {
      return { ok: false, reason: 'invalid_credentials' };
    }

    // Password correct from here on. Now the account-status gate.
    if (user.accountStatus === 'suspended') {
      return { ok: false, reason: 'account_suspended' };
    }
    if (user.accountStatus === 'pending_verification') {
      return {
        ok: false,
        reason: 'email_unverified',
        email: user.email,
      };
    }
    if (user.accountStatus === 'pending_profile') {
      return {
        ok: false,
        reason: 'profile_incomplete',
        setupToken: tokenService.issueSetupToken(user._id.toString()),
      };
    }

    // Active. Proceed.
    user.lastActiveAt = new Date();
    await user.save();

    await activityService.record({
      userId: user._id.toString(),
      type: 'login',
      xp: 0,
    });

    return {
      ok: true,
      user: sanitize(user),
      accessToken: signToken(user._id.toString()),
    };
  },

  async me(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return sanitize(user);
  },
};

function sanitize(user: UserDocument) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}