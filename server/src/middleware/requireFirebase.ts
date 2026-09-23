import type { Request, Response, NextFunction } from 'express';
import { isFirebaseConfigured } from '../services/firebase.service.js';

/**
 * Rejects requests to Google-auth endpoints when Firebase isn't
 * configured. Returns 503 rather than 500 so operators can tell the
 * difference between "our code broke" and "this feature is turned
 * off in this environment".
 */
export function requireFirebase(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isFirebaseConfigured()) {
    res.status(503).json({
      success: false,
      message: 'Google sign-in is not enabled on this server.',
      reason: 'firebase_not_configured',
    });
    return;
  }
  next();
}