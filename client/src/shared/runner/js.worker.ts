/// <reference lib="webworker" />

/**
 * JavaScript sandbox worker.
 *
 * Runs user code in a fresh scope and captures console output.
 * Anything the worker needs must be inlined - do NOT add top-level
 * `import` statements. Vite emits module workers when it sees
 * top-level imports, which breaks the classic-worker configuration.
 */

type InMsg = { type: 'run'; code: string };

type OutMsg =
  | { type: 'stdout'; text: string }
  | { type: 'done'; runtimeMs: number }
  | { type: 'error'; text: string; kind: 'runtime' | 'syntax'; runtimeMs: number };

const post = (msg: OutMsg) => (self as unknown as Worker).postMessage(msg);

self.onmessage = async (e: MessageEvent<InMsg>) => {
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

  const sandboxConsole = {
    log: capture(''),
    info: capture('[info] '),
    warn: capture('[warn] '),
    error: capture('[error] '),
    debug: capture('[debug] '),
  };

  let fn: (console: typeof sandboxConsole) => Promise<unknown>;
  try {
    fn = new Function(
      'console',
      `"use strict";
       return (async () => {
         ${e.data.code}
       })();`
    ) as typeof fn;
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    post({
      type: 'error',
      text: msg,
      kind: 'syntax',
      runtimeMs: Math.round(performance.now() - start),
    });
    return;
  }

  try {
    const returnValue = await fn(sandboxConsole);

    if (returnValue !== undefined) {
      lines.push(stringify(returnValue));
    }

    if (lines.length > 0) {
      post({ type: 'stdout', text: lines.join('\n') });
    }

    post({ type: 'done', runtimeMs: Math.round(performance.now() - start) });
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    if (lines.length > 0) {
      post({ type: 'stdout', text: lines.join('\n') });
    }
    post({
      type: 'error',
      text: msg,
      kind: 'runtime',
      runtimeMs: Math.round(performance.now() - start),
    });
  }
};