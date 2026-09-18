import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // Flatten Zod issues into something actionable
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      // Log once server-side so debugging is easy
      // eslint-disable-next-line no-console
      console.warn('[validate] 400', {
        method: req.method,
        url: req.originalUrl,
        issues,
      });

      const err = new ApiError(400, 'Validation failed', true);
      // Attach details for the error handler to serialize
      (err as ApiError & { details?: unknown }).details = issues;
      return next(err);
    }

    // IMPORTANT: replace req.body with the parsed result so defaults apply
    // and unknown keys are stripped.
    req.body = result.data.body ?? req.body;
    next();
  };
};