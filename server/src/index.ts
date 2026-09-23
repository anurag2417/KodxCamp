import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import {
  startClassLifecycleJob,
  stopClassLifecycleJob,
} from './jobs/classLifecycle.job.js';
import {
  startEmailQueueJob,
  stopEmailQueueJob,
} from './jobs/emailQueue.job.js';

async function bootstrap() {
  try {
    await connectDB();
  } catch (err) {
    logger.error('Failed to connect to MongoDB', {
      err: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 KodxCamp API running on port ${env.PORT}`, {
      env: env.NODE_ENV,
      clientUrl: env.CLIENT_URL,
    });
    startClassLifecycleJob();
    startEmailQueueJob();
  });

  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down gracefully`);

    stopClassLifecycleJob();
    stopEmailQueueJob();

    const killTimer = setTimeout(() => {
      logger.error('Forced shutdown after 10s');
      process.exit(1);
    }, 10_000);
    killTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    } catch (err) {
      logger.error('Error closing HTTP server', {
        err: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    } catch (err) {
      logger.error('Error disconnecting MongoDB', {
        err: err instanceof Error ? err.message : String(err),
      });
    }

    clearTimeout(killTimer);
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception — exiting', {
      err: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});