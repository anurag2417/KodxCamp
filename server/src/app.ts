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

  // ─── Keepalive endpoint ────────────────────────────────────────
  //
  // Deliberately mounted BEFORE the global rate limiter so external
  // uptime monitors (UptimeRobot) don't consume the API quota. The
  // response is a constant payload and does not touch the database —
  // the whole point is to be cheap, so a monitor can hit it every
  // 5 minutes indefinitely without triggering anything else.
  //
  // This is what keeps the Render free-tier service warm. Without it,
  // the container spins down after ~15 minutes of inactivity and the
  // next user-facing request pays a 30–60s cold start.
  //
  // The path is nested under /api/health so it sits alongside the
  // existing /api/health route and is obviously related to health.
  app.get('/api/health/keepalive', (_req, res) => {
    res.status(200).json({ ok: true });
  });

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
      const buf = req.body as unknown as Buffer;
      (req as express.Request & { rawBody?: string }).rawBody =
        buf.toString('utf8');
      try {
        req.body = JSON.parse(
          (req as express.Request & { rawBody?: string }).rawBody ?? '{}'
        );
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
        // Skip the keepalive path so its 5-minute pings don't flood
        // the logs. The route returns a constant and is uninteresting
        // at the access-log level.
        skip: (req) =>
          req.path === '/api/health' || req.path === '/api/health/keepalive',
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