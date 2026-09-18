import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    logger.error('Server error', {
      method: req.method,
      url: req.originalUrl,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  } else if (statusCode !== 401 && statusCode !== 404) {
    logger.warn('Client error', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message,
    });
  }

  const body: Record<string, unknown> = {
    success: false,
    message:
      env.NODE_ENV === 'production' && statusCode >= 500
        ? 'Internal server error'
        : message,
  };

  // Include field-level validation details when present
  const details = (err as ApiError & { details?: unknown }).details;
  if (details !== undefined) {
    body.details = details;
  }

  if (env.NODE_ENV === 'development' && statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};