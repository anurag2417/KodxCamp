import type { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    email: z.string().email(),
    password: z.string().min(6).max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cookie config.
 *
 * In production we deploy client and API on different origins
 * (Vercel + Render), so the cookie must be:
 *   - SameSite=None (cross-origin safe)
 *   - Secure (required when SameSite=None)
 *
 * In development everything is localhost, so Lax is fine and we skip Secure.
 */
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

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.cookie(COOKIE_NAME, result.accessToken, cookieOptions());
    return ApiResponse.success(res, result, 'Registered', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.cookie(COOKIE_NAME, result.accessToken, cookieOptions());
    return ApiResponse.success(res, result, 'Logged in');
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