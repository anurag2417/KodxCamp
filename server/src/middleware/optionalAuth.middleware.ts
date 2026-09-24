import type { Request, Response, NextFunction } from 'express';
import { requireAuth, type AuthRequest } from './auth.middleware.js';

/**
 * Attach `req.user` if a valid token is present, but never reject the
 * request.
 *
 * Used on public endpoints whose response varies for signed-in users
 * (e.g. `solved: true` flags on problem listings, `enrolled: true` on
 * class listings).
 *
 * If a token is present but invalid or expired, we deliberately swallow
 * the error and treat the request as anonymous. This avoids 401s on
 * public pages when a stale cookie is lingering in the browser - the
 * user can still browse, and their next authenticated action will
 * surface the real auth error.
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    next();
    return;
  }

  requireAuth(req as AuthRequest, res, (err?: unknown) => {
    if (err) {
      // Invalid/expired token → treat as anonymous rather than 401.
      next();
      return;
    }
    next();
  });
}