/// <reference lib="webworker" />

/**
 * JavaScript sandbox worker.
 *
 * Two modes:
 *  - `run`        — visible test / playground. Returns raw stdout.
 *  - `run-hidden` — hidden test. Hashes the output inside the worker
 *                   and posts back only `{ passed }`.
 *
 * Anything the worker needs must be inlined. Do NOT add top-level
 * `import` statements — that forces Vite to emit a module worker,
 * which breaks the classic-worker configuration in `vite.config.ts`.
 */

type WorkerCanonicalizationId =
  | 'trim-trailing-newline'
  | 'trim-all'
  | 'exact';

type JsWorkerInMsg =
  | { type: 'run'; code: string }
  | {
      type: 'run-hidden';
      requestId: string;
      code: string;
      expectedOutputHash: string;
      canonicalization: WorkerCanonicalizationId;
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

// ─── Inlined canonicalization ─────────────────────────────────────
//
// Mirrors `shared/src/testcase/canonicalize.ts`. Inlined because we
// cannot import in a classic worker.

function workerCanonicalize(
  output: string,
  id: WorkerCanonicalizationId = 'trim-trailing-newline'
): string {
  switch (id) {
    case 'trim-trailing-newline':
      return output
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n$/, '');
    case 'trim-all':
      return output.replace(/\r\n/g, '\n').trim();
    case 'exact':
      return output;
  }
}

async function workerSha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Execution ────────────────────────────────────────────────────

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

// ─── Message handling ─────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<JsWorkerInMsg>) => {
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
      const canonical = workerCanonicalize(result.stdout, canonicalization);
      const actualHash = await workerSha256Hex(canonical);
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