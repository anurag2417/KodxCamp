import { invitationService } from '../services/invitation.service.js';
import { logger } from '../utils/logger.js';

let timer: NodeJS.Timeout | null = null;

const INTERVAL_MS = 60 * 60 * 1000; // hourly

async function tick(): Promise<void> {
  try {
    const count = await invitationService.expireStale();
    if (count > 0) {
      logger.info('Expired invitations', { count });
    }
  } catch (err) {
    logger.error('Invitation cleanup job failed', {
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

export function startInvitationCleanupJob(): void {
  if (timer) return;
  timer = setInterval(tick, INTERVAL_MS);
  void tick();
  logger.info('Invitation cleanup job started');
}

export function stopInvitationCleanupJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('Invitation cleanup job stopped');
  }
}