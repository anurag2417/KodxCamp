import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Origin-check CSRF protection.
 *
 * For state-changing methods (POST/PUT/PATCH/DELETE), require the request
 * Origin (or Referer fallback) to be in the CLIENT_URL allowlist.
 *
 * This is sufficient when combined with:
 *   - SameSite=None; Secure cookies in production
 *   - HttpOnly cookies (no JS access)
 *   - No wildcard CORS (Origin allowlist enforced by `cors()` too)
 *
 * It does NOT need a token because cross-site POSTs will carry an Origin
 * that isn't in the allowlist. Browsers always set Origin for cross-origin
 * requests, and same-origin ones either set it or leave it undefined - in
 * the latter case we fall back to Referer, then to trusting same-origin.
 */
export function csrfMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const candidate = origin ?? referer;

  // No origin/referer at all → likely a same-origin request from an old
  // browser or a server-to-server call without an Origin header. Allow.
  // (Browsers cannot omit both for cross-site XHR/fetch/form submit.)
  if (!candidate) return next();

  // Extract the origin from the candidate (referer contains a full URL)
  let candidateOrigin: string;
  try {
    candidateOrigin = new URL(candidate).origin;
  } catch {
    return next(new ApiError(400, 'Invalid Origin header'));
  }

  if (env.CLIENT_URL.includes(candidateOrigin)) return next();

  // Same host but different port (dev edge case) - allow when the request
  // host matches the origin host. This covers dev with 5173 → 5000 through
  // a proxy that rewrites Origin.
  const requestHost = req.get('host');
  try {
    const parsed = new URL(candidate);
    if (requestHost && parsed.host === requestHost) return next();
  } catch {
    /* ignore */
  }

  return next(new ApiError(403, 'Cross-site request blocked'));
}