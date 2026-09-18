import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  // Trust Render / Vercel / nginx proxy
  app.set('trust proxy', 1);

  // ─── Request ID ─────────────────────────────────────────────
  app.use((req, res, next) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length > 0
      ? incoming
      : crypto.randomUUID();
    (req as express.Request & { id: string }).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // ─── Security headers ───────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // for /uploads/video
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    })
  );

  // ─── CORS ────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      maxAge: 86400, // cache preflight for 24h
    })
  );

  // ─── Body parsers ────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(compression());

  // ─── HTTP logging ────────────────────────────────────────────
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        skip: (req) => req.path === '/api/health',
        stream: { write: (msg: string) => logger.info('HTTP', { line: msg.trim() }) },
      })
    );
  }

  // ─── Static uploads ─────────────────────────────────────────
  // Always ensure the directory exists AND always register the middleware.
  // (Previously gated on existsSync at boot, which broke after a fresh deploy.)
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(path.join(uploadsDir, 'recordings'), { recursive: true });

  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '1h',
      setHeaders: (res) => {
        res.setHeader('Accept-Ranges', 'bytes');
      },
    })
  );

  // ─── Rate limiting ──────────────────────────────────────────
  app.use('/api', globalLimiter);

  // ─── API routes ─────────────────────────────────────────────
  app.use('/api', routes);

  // API 404 — returns JSON, not index.html
  app.use('/api', notFound);

  // ─── (Optional) serve built client in monolith mode ─────────
  if (env.NODE_ENV === 'production') {
    const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      // SPA fallback for non-API routes only
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  // Catch-all 404 (dev only — production has SPA fallback above)
  app.use(notFound);

  // Error handler — must be last
  app.use(errorHandler);

  return app;
}