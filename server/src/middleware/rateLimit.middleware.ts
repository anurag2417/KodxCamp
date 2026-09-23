import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const skipInDev = () => env.NODE_ENV === 'development';

/** Global API limit — generous but protective. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: { success: false, message: 'Too many requests, slow down.' },
});

/** Auth endpoints — strict, to prevent brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: { success: false, message: 'Too many auth attempts, try again later.' },
});

/**
 * OTP request endpoints — very strict to prevent email spam to a
 * victim's inbox. Ten requests per hour per IP.
 */
export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: {
    success: false,
    message: 'Too many code requests. Try again in an hour.',
  },
});

/** Code submission — moderate, to prevent spam. */
export const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: { success: false, message: 'Too many submissions, slow down.' },
});