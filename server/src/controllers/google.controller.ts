import type { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { googleAuthService } from '../services/googleAuth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import type { UserDocument } from '../models/User.model.js';

export const googleSignInSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Firebase ID token is required'),
  }),
});

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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

function signToken(id: string): string {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function sanitizeUser(user: UserDocument) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

export const googleController = {
  /**
   * POST /api/auth/google
   *
   * The client obtains a Firebase ID token from the Google popup and
   * posts it here. We verify it and return the same shape as
   * `/auth/login`: `{ user, accessToken }` + HTTP-only cookie.
   */
  signIn: asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const { user, isNewUser } = await googleAuthService.signIn(idToken);

    const accessToken = signToken(user._id.toString());
    res.cookie(COOKIE_NAME, accessToken, cookieOptions());

    return ApiResponse.success(
      res,
      {
        user: sanitizeUser(user),
        accessToken,
        isNewUser,
      },
      isNewUser ? 'Account created' : 'Logged in',
      isNewUser ? 201 : 200
    );
  }),
};