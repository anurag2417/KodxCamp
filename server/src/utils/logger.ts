import { env } from '../config/env.js';

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const minLevel = LEVELS[env.LOG_LEVEL];

const stamp = () => new Date().toISOString();

function emit(level: Level, msg: string, meta?: unknown) {
  if (LEVELS[level] < minLevel) return;

  const prefix = `[${stamp()}] [${level.toUpperCase()}]`;
  const line = meta !== undefined ? `${prefix} ${msg} ${safeJson(meta)}` : `${prefix} ${msg}`;

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
  debug: (msg: string, meta?: unknown) => emit('debug', msg, meta),
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
};