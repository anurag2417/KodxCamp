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
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  // Behind Render/Vercel/nginx — trust the proxy so rate-limit + secure cookies work
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // client is served by Vercel; CSP managed there
    })
  );

  // CORS — allow the configured client origin + cookies
  app.use(
    cors({
      origin: env.CLIENT_URL.split(',').map((s) => s.trim()),
      credentials: true,
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
        stream: { write: (msg: string) => logger.info('HTTP', { line: msg.trim() }) },
      })
    );
  }

  // Static uploads (dev only — production uses Cloudinary/external storage)
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use(
      '/uploads',
      express.static(uploadsDir, {
        maxAge: '1h',
        setHeaders: (res) => {
          res.setHeader('Accept-Ranges', 'bytes');
        },
      })
    );
  }

  // Rate limiting
  app.use('/api', globalLimiter);

  // Routes
  app.use('/api', routes);

  // In production, optionally serve the built client (monolith mode)
  if (env.NODE_ENV === 'production') {
    const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      // SPA fallback: serve index.html for any non-API route
      app.get(/^\/(?!api|uploads).*/, (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}