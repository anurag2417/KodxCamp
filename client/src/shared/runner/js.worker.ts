/// <reference lib="webworker" />

import { canonicalize } from '@kodxcamp/shared';

/**
 * JavaScript sandbox worker.
 *
 * Two modes:
 *  - `run`        — visible test / playground. Returns raw stdout.
 *  - `run-hidden` — hidden test. Hashes the output inside the worker
 *                   and posts back only `{ passed }`. Raw stdout
 *                   never crosses the worker boundary.
 */

type InMsg =
  | { type: 'run'; code: string }
  | {
      type: 'run-hidden';
      requestId: string;
      code: string;
      expectedOutputHash: string;
      canonicalization: 'trim-trailing-newline' | 'trim-all' | 'exact';
    };

type OutMsg =
  | { type: 'stdout'; text: string }
  | { type: 'done'; runtimeMs: number }
  | { type: 'error'; text: string; kind: 'runtime' | 'syntax'; runtimeMs: number }
  | {
      type: 'hidden-result';
      requestId: string;
      passed: boolean;
      runtimeMs: number;
    };

const post = (msg: OutMsg) => (self as unknown as Worker).postMessage(msg);

// ─── Shared execution core ──────────────────────────────────────
//
// Both modes run the same wrapped code. `captureOutput` decides what
// to do with it: post it (visible) or hash it (hidden).

interface ExecutionResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  kind?: 'runtime' | 'syntax';
  runtimeMs: number;
}

async function execute(code: string): Promise<ExecutionResult> {
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

  // Compile
  let fn: (console: typeof sandboxConsole) => Promise<unknown>;
  try {
    fn = new Function(
      'console',
      `"use strict";
       return (async () => {
         ${code}
       })();`
    ) as typeof fn;
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      ok: false,
      stdout: '',
      stderr: msg,
      kind: 'syntax',
      runtimeMs: Math.round(performance.now() - start),
    };
  }

  // Execute
  try {
    const returnValue = await fn(sandboxConsole);
    if (returnValue !== undefined) {
      lines.push(stringify(returnValue));
    }
    return {
      ok: true,
      stdout: lines.join('\n'),
      stderr: '',
      runtimeMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      ok: false,
      stdout: lines.join('\n'),
      stderr: msg,
      kind: 'runtime',
      runtimeMs: Math.round(performance.now() - start),
    };
  }
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Message handling ───────────────────────────────────────────

self.onmessage = async (e: MessageEvent<InMsg>) => {
  if (e.data.type === 'run') {
    const result = await execute(e.data.code);

    if (result.ok) {
      if (result.stdout) post({ type: 'stdout', text: result.stdout });
      post({ type: 'done', runtimeMs: result.runtimeMs });
    } else {
      if (result.stdout) post({ type: 'stdout', text: result.stdout });
      post({
        type: 'error',
        text: result.stderr,
        kind: result.kind ?? 'runtime',
        runtimeMs: result.runtimeMs,
      });
    }
    return;
  }

  if (e.data.type === 'run-hidden') {
    const { requestId, code, expectedOutputHash, canonicalization } = e.data;
    const result = await execute(code);

    let passed = false;
    if (result.ok) {
      const canonical = canonicalize(result.stdout, canonicalization);
      const actualHash = await sha256Hex(canonical);
      passed = actualHash === expectedOutputHash;
    }

    post({
      type: 'hidden-result',
      requestId,
      passed,
      runtimeMs: result.runtimeMs,
    });
  }
};