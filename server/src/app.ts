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
import { paymentController } from './controllers/payment.controller.js';
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
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
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

  // ─── Razorpay webhook ──────────────────────────────────────────
  //
  // Must be mounted BEFORE express.json(). The webhook signature is
  // HMAC over the raw request body, and once express.json() has parsed
  // the body the raw bytes are gone. This route stashes the raw text
  // on `req.rawBody` and then hands it off to the controller.
  //
  // Rate limiting is intentionally NOT applied here - Razorpay retries
  // failed webhooks with exponential backoff and a 429 would make them
  // give up.
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json', limit: '1mb' }),
    (req, res, next) => {
      // express.raw gives us a Buffer in req.body. Save the string
      // form for signature verification, then re-parse it so the
      // controller can read the payload.
      const buf = req.body as unknown as Buffer;
      (req as express.Request & { rawBody?: string }).rawBody =
        buf.toString('utf8');
      try {
        req.body = JSON.parse((req as express.Request & { rawBody?: string }).rawBody ?? '{}');
      } catch {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid JSON body' });
      }
      next();
    },
    paymentController.webhook
  );

  // Body parsers (everything else)
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

  // ─── Serve built client in production ────
  if (env.NODE_ENV === 'production') {
    const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');

    logger.info('Client serving check', {
      cwd: process.cwd(),
      clientDist,
      exists: fs.existsSync(clientDist),
    });

    if (fs.existsSync(clientDist)) {
      app.use(
        express.static(clientDist, {
          maxAge: '1y',
          immutable: true,
          index: false,
        })
      );

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

  app.use(notFound);
  app.use(errorHandler);

  return app;
}