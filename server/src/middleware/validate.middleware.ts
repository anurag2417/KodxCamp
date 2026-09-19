import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      logger.debug('Validation failed', {
        method: req.method,
        url: req.originalUrl,
        requestId: req.id,
        issues,
      });

      const err = new ApiError(400, 'Validation failed', true);
      (err as ApiError & { details?: unknown }).details = issues;
      return next(err);
    }

    // Replace with parsed data (defaults applied, unknown keys stripped)
    req.body = result.data.body ?? req.body;
    next();
  };
};