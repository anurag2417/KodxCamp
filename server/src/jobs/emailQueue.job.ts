import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

let timer: NodeJS.Timeout | null = null;
let running = false;

const INTERVAL_MS = 60_000;
const BATCH_SIZE = 20;
const DELAY_BETWEEN_MS = 1500;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const { sent, failed } = await emailService.processQueue(
      BATCH_SIZE,
      DELAY_BETWEEN_MS
    );
    if (sent > 0 || failed > 0) {
      logger.info('Email queue processed', { sent, failed });
    }
  } catch (err) {
    logger.error('Email queue job failed', {
      err: err instanceof Error ? err.message : String(err),
    });
  } finally {
    running = false;
  }
}

export function startEmailQueueJob(): void {
  if (timer) return;
  timer = setInterval(tick, INTERVAL_MS);
  void tick();
  logger.info('Email queue job started');
}

export function stopEmailQueueJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('Email queue job stopped');
  }
}