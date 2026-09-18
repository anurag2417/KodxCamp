/// <reference lib="webworker" />

/**
 * JavaScript sandbox worker.
 *
 * Runs user code in a fresh scope. Captures console output.
 * Any uncaught error or timeout kills the worker (see jsRunner.ts).
 */

type InMsg = { type: 'run'; code: string };
type OutMsg =
  | { type: 'stdout'; text: string }
  | { type: 'stderr'; text: string }
  | { type: 'done'; runtimeMs: number }
  | { type: 'error'; text: string; runtimeMs: number };

const post = (msg: OutMsg) => (self as unknown as Worker).postMessage(msg);

self.onmessage = (e: MessageEvent<InMsg>) => {
  if (e.data.type !== 'run') return;

  const start = performance.now();
  const lines: string[] = [];

  const stringify = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  const capture = (prefix: string) => (...args: unknown[]) =>
    lines.push(prefix + args.map(stringify).join(' '));

  // Override console inside the worker
  const sandboxConsole = {
    log: capture(''),
    info: capture('[info] '),
    warn: capture('[warn] '),
    error: capture('[error] '),
    debug: capture('[debug] '),
  };

  try {
    // Wrap in a function so top-level `var`/`let`/`const` stay scoped
    const fn = new Function('console', `"use strict";\n${e.data.code}\n`);
    const returnValue = fn(sandboxConsole);

    if (returnValue !== undefined) {
      lines.push(stringify(returnValue));
    }

    if (lines.length > 0) {
      post({ type: 'stdout', text: lines.join('\n') });
    }

    post({ type: 'done', runtimeMs: Math.round(performance.now() - start) });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    if (lines.length > 0) {
      post({ type: 'stdout', text: lines.join('\n') });
    }
    post({
      type: 'error',
      text: msg,
      runtimeMs: Math.round(performance.now() - start),
    });
  }
};