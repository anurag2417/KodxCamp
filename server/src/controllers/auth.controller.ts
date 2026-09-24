import type { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service.js';
import { otpService } from '../services/otp.service.js';
import { passwordResetService } from '../services/passwordReset.service.js';
import { User } from '../models/User.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

// ─── Zod schemas ─────────────────────────────────────────────────

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Enter a valid email address'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().min(1, 'Code is required').max(10, 'Code is too long'),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    setupToken: z.string().min(1, 'Setup token is required'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Enter a valid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100),
  }),
});

// ─── Cookie config ───────────────────────────────────────────────

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function cookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function signToken(id: string): string {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function sanitizeUser(user: InstanceType<typeof User>) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

// ─── Controllers ─────────────────────────────────────────────────

export const authController = {
  /**
   * Step 1 - request an OTP. Creates a pending user if the email is
   * new, or resends to an unverified user.
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await otpService.requestOtp(email);

    return ApiResponse.success(
      res,
      { message: 'Check your email for a verification code.' },
      'Verification code sent',
      201
    );
  }),

  /**
   * Step 2 - verify the OTP. Returns a setup token.
   */
  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const { setupToken } = await otpService.verifyOtp(email, code);
    return ApiResponse.success(res, { setupToken }, 'Code verified');
  }),

  /**
   * Step 3 - set name and password, activate the account, and log in.
   */
  setPassword: asyncHandler(async (req: Request, res: Response) => {
    const { setupToken, name, password } = req.body;
    const { userId } = await otpService.setPassword(
      setupToken,
      name,
      password
    );

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const accessToken = signToken(user._id.toString());
    res.cookie(COOKIE_NAME, accessToken, cookieOptions());

    return ApiResponse.success(
      res,
      { user: sanitizeUser(user), accessToken },
      'Account created',
      201
    );
  }),

  /**
   * Resend the OTP. Same shape as register, same neutral response.
   */
  resendOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await otpService.resendOtp(email);
    return ApiResponse.success(
      res,
      { message: 'Check your email for a verification code.' },
      'Verification code sent'
    );
  }),

  /**
   * Log in. The response shape depends on the account status.
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    if (!result.ok) {
      switch (result.reason) {
        case 'invalid_credentials':
          throw new ApiError(401, 'Invalid email or password');
        case 'email_unverified':
          return res.status(403).json({
            success: false,
            message: 'Please verify your email first.',
            reason: 'email_unverified',
            data: { email: result.email },
          });
        case 'profile_incomplete':
          return res.status(403).json({
            success: false,
            message: 'Please finish setting up your account.',
            reason: 'profile_incomplete',
            data: { setupToken: result.setupToken },
          });
        case 'account_suspended':
          throw new ApiError(403, 'This account is suspended.');
      }
    }

    res.cookie(COOKIE_NAME, result.accessToken, cookieOptions());
    return ApiResponse.success(
      res,
      { user: result.user, accessToken: result.accessToken },
      'Logged in'
    );
  }),

  /**
   * Request a password reset link. Always responds with the same
   * neutral message, regardless of whether the email exists.
   */
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await passwordResetService.request(email);
    return ApiResponse.success(
      res,
      { message: 'If an account exists for that email, we sent a reset link.' },
      'Check your email'
    );
  }),

  /**
   * Consume a reset token and set a new password. Logs the user in
   * on success - same session shape as `/auth/login`.
   */
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    const { userId } = await passwordResetService.consume(token, password);

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const accessToken = signToken(user._id.toString());
    res.cookie(COOKIE_NAME, accessToken, cookieOptions());

    return ApiResponse.success(
      res,
      { user: sanitizeUser(user), accessToken },
      'Password updated'
    );
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return ApiResponse.success(res, null, 'Logged out');
  }),

  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.me(req.user!._id.toString());
    return ApiResponse.success(res, user);
  }),
};