import type { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from './auth.middleware.js';

/**
 * Global permission values. Must match `GLOBAL_PERMISSIONS` in
 * `shared/src/types/permissions.ts`.
 */
export type GlobalPermission =
  | 'problem_author'
  | 'project_author'
  | 'course_author'
  | 'class_coordinator';

/**
 * Use after `requireAuth`. Ensures the user has the given global
 * permission. Admins bypass the check implicitly.
 *
 * Usage:
 *   router.post('/problems', requireAuth, requirePermission('problem_author'), ...)
 *
 * Not wired to any route yet. Batch 2E attaches it to the relevant
 * admin and instructor endpoints.
 */
export function requirePermission(...required: GlobalPermission[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (req.user.role === 'admin') {
      return next();
    }
    const granted = req.user.permissions ?? [];
    const missing = required.filter((p) => !granted.includes(p));
    if (missing.length > 0) {
      return next(
        new ApiError(
          403,
          `Missing permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`
        )
      );
    }
    next();
  };
}