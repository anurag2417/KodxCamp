import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  // Behind Render / Vercel / nginx proxies
  app.set('trust proxy', 1);

  // Request ID
  app.use(requestIdMiddleware);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      maxAge: 86_400,
    })
  );

  // Body parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(compression());

  // HTTP logging
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        skip: (req) => req.path === '/api/health',
        stream: {
          write: (msg: string) => logger.info('HTTP', { line: msg.trim() }),
        },
      })
    );
  }

  // Static uploads
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(path.join(uploadsDir, 'recordings'), { recursive: true });
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '1h',
      setHeaders: (res) => res.setHeader('Accept-Ranges', 'bytes'),
    })
  );

  // Rate limiting
  app.use('/api', globalLimiter);

  // API routes
  app.use('/api', routes);

  // API 404s
  app.use('/api', notFound);

  // ─── Serve built client in production (monolith) ────
  if (env.NODE_ENV === 'production') {
    const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');

    // Debug logs - remove after confirming
    logger.info('Client serving check', {
      cwd: process.cwd(),
      clientDist,
      exists: fs.existsSync(clientDist),
    });

    if (fs.existsSync(clientDist)) {
      // Static assets (JS, CSS, images)
      app.use(
        express.static(clientDist, {
          maxAge: '1y',
          immutable: true,
          index: false,
        })
      );

      // SPA fallback - every non-API, non-uploads route returns index.html
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });

      logger.info('✅ Serving client from', { clientDist });
    } else {
      logger.warn('⚠️  Client dist not found - API-only mode', {
        clientDist,
      });
    }
  }

  // 404 (dev only, or if client dist missing in prod)
  app.use(notFound);

  // Error handler - always last
  app.use(errorHandler);

  return app;
}