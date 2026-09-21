import type { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from './auth.middleware.js';

/**
 * Use after requireAuth. Ensures the user is an instructor OR admin.
 *
 * NOTE: This only checks the *global* role. Resource-level access (which
 * courses they're on the team for) is enforced by the permissions service.
 */
export function requireInstructor(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Instructor access required'));
  }
  next();
}