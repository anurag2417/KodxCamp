import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface SerializedError {
  statusCode: number;
  message: string;
  details?: unknown;
}

function serializeError(err: unknown): SerializedError {
  // App-level errors
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      details: (err as ApiError & { details?: unknown }).details,
    };
  }

  // Mongoose validation errors → 400
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return { statusCode: 400, message: 'Validation failed', details };
  }

  // Mongoose CastError (bad ObjectId, etc.) → 400
  if (err instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      message: `Invalid value for "${err.path}"`,
      details: [{ path: err.path, message: err.message }],
    };
  }

  // Duplicate key (unique index) → 409
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const fields = Object.keys(keyValue).join(', ');
    return {
      statusCode: 409,
      message: fields
        ? `Duplicate value for ${fields}`
        : 'Duplicate value',
      details: [{ path: fields, message: 'Already exists' }],
    };
  }

  // Anything else → 500
  return {
    statusCode: 500,
    message: err instanceof Error ? err.message : 'Internal server error',
  };
}

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { statusCode, message, details } = serializeError(err);

  if (statusCode >= 500) {
    logger.error('Server error', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message,
      requestId: req.id,
      stack:
        env.NODE_ENV === 'development' && err instanceof Error
          ? err.stack
          : undefined,
    });
  } else if (statusCode !== 401 && statusCode !== 404) {
    logger.warn('Client error', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message,
      requestId: req.id,
    });
  }

  const body: Record<string, unknown> = {
    success: false,
    message:
      env.NODE_ENV === 'production' && statusCode >= 500
        ? 'Internal server error'
        : message,
    requestId: req.id,
  };

  if (details !== undefined) body.details = details;

  if (
    env.NODE_ENV === 'development' &&
    statusCode >= 500 &&
    err instanceof Error
  ) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};