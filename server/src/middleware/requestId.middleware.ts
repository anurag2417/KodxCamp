import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Attach a request ID to every request.
 * Accepts X-Request-Id from the client if present; generates one otherwise.
 * Echoes it back in the response header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && incoming.length > 0
      ? incoming
      : crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}