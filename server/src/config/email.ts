import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * The one and only Nodemailer transport.
 *
 * Every email KodxCamp sends goes through this instance. Do not
 * construct additional transports elsewhere — Gmail enforces
 * per-account connection limits, and multiple transports race each
 * other.
 *
 * In development (`EMAIL_ENABLED=false`), the transport is created but
 * sends are short-circuited by `emailService.send`. See
 * `services/email.service.ts`.
 */
function createTransport(): Transporter | null {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    logger.warn('SMTP not configured — outgoing email is disabled', {
      host: Boolean(host),
      port: Boolean(port),
      user: Boolean(user),
      pass: Boolean(pass),
    });
    return null;
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });

  return transport;
}

export const mailTransport: Transporter | null = createTransport();

export const EMAIL_FROM = env.EMAIL_FROM ?? 'KodxCamp <no-reply@kodxcamp.dev>';
export const EMAIL_ENABLED =
  env.EMAIL_ENABLED ?? Boolean(mailTransport);