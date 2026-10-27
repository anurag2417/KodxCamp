import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Origin-check CSRF protection.
 *
 * For state-changing methods (POST/PUT/PATCH/DELETE), require the
 * request Origin (or Referer fallback) to be in the CLIENT_URL
 * allowlist.
 *
 * This is sufficient when combined with:
 *   - SameSite=None; Secure cookies in production
 *   - HttpOnly cookies (no JS access)
 *   - No wildcard CORS (Origin allowlist enforced by `cors()` too)
 *
 * It does NOT need a token because cross-site POSTs will carry an
 * Origin that isn't in the allowlist.
 *
 * DEV-ONLY FALLBACK:
 *
 *   The Vite dev server proxies /api from :5173 to :5000 without
 *   rewriting the Origin header, so a same-host check needs a
 *   fallback to allow local development. That fallback is gated on
 *   NODE_ENV === 'development'. It is NOT active in production —
 *   the API and the client are on different hosts there, and if the
 *   fallback were on, a request from any sibling service on the
 *   same host would bypass the CSRF check.
 */
export function csrfMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const candidate = origin ?? referer;

  // No origin/referer at all → likely a same-origin request from an
  // old browser or a server-to-server call without an Origin header.
  // Allow. (Browsers cannot omit both for cross-site XHR/fetch/form.)
  if (!candidate) return next();

  // "Origin: null" is sent by sandboxed iframes and some data: URL
  // contexts. Treat it as cross-site, not as a URL to parse.
  if (candidate === 'null') {
    return next(new ApiError(403, 'Cross-site request blocked'));
  }

  // Extract the origin from the candidate (referer contains a full URL)
  let candidateOrigin: string;
  try {
    candidateOrigin = new URL(candidate).origin;
  } catch {
    return next(new ApiError(400, 'Invalid Origin header'));
  }

  if (env.CLIENT_URL.includes(candidateOrigin)) return next();

  // Same-host fallback — dev only. See the module doc-comment.
  if (env.NODE_ENV === 'development') {
    const requestHost = req.get('host');
    try {
      const parsed = new URL(candidate);
      if (requestHost && parsed.host === requestHost) return next();
    } catch {
      /* ignore */
    }
  }

  return next(new ApiError(403, 'Cross-site request blocked'));
}