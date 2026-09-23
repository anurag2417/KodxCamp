import { Router } from 'express';
import {
  authController,
  registerSchema,
  verifyOtpSchema,
  setPasswordSchema,
  loginSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/auth.controller.js';
import {
  googleController,
  googleSignInSchema,
} from '../controllers/google.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireFirebase } from '../middleware/requireFirebase.js';
import {
  authLimiter,
  otpRequestLimiter,
} from '../middleware/rateLimit.middleware.js';

const router = Router();

// ─── OTP signup ──────────────────────────────────────────────────
router.post(
  '/register',
  otpRequestLimiter,
  validate(registerSchema),
  authController.register
);
router.post(
  '/resend-otp',
  otpRequestLimiter,
  validate(resendOtpSchema),
  authController.resendOtp
);
router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp
);
router.post(
  '/set-password',
  authLimiter,
  validate(setPasswordSchema),
  authController.setPassword
);

// ─── Password reset ──────────────────────────────────────────────
router.post(
  '/forgot-password',
  otpRequestLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ─── Login ───────────────────────────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// ─── Google ──────────────────────────────────────────────────────
router.post(
  '/google',
  requireFirebase,
  authLimiter,
  validate(googleSignInSchema),
  googleController.signIn
);

// ─── Session ─────────────────────────────────────────────────────
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;