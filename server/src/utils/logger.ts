import { env } from '../config/env.js';

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const minLevel = LEVELS[env.LOG_LEVEL];

/**
 * Structured logger.
 *
 * - In development: human-readable single-line output with a timestamp prefix.
 * - In production: JSON lines so log aggregators (Render, Datadog, etc.) can
 *   parse them.
 */
function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < minLevel) return;

  const time = new Date().toISOString();

  if (env.NODE_ENV === 'production') {
    const payload: Record<string, unknown> = {
      level,
      time,
      msg,
      pid: process.pid,
    };
    if (meta && Object.keys(meta).length > 0) {
      Object.assign(payload, meta);
    }
    // JSON to stdout so aggregators capture it
    if (level === 'error') process.stderr.write(JSON.stringify(payload) + '\n');
    else process.stdout.write(JSON.stringify(payload) + '\n');
    return;
  }

  // Dev: readable single line
  const prefix = `[${time}] [${level.toUpperCase()}]`;
  const line =
    meta && Object.keys(meta).length > 0
      ? `${prefix} ${msg} ${safeJson(meta)}`
      : `${prefix} ${msg}`;

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
};