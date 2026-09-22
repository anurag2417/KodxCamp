/// <reference lib="webworker" />

import { canonicalize } from '@kodxcamp/shared';

/**
 * Python sandbox worker — runs Pyodide off the main thread.
 *
 * Two modes:
 *  - `run`        — visible test / playground. Returns raw stdout.
 *  - `run-hidden` — hidden test. Hashes the output inside the worker
 *                   and posts back only `{ passed }`.
 *
 * This worker is bundled as a *classic* worker (see vite.config.ts →
 * `worker.format: 'iife'`). Classic workers can use `importScripts`,
 * which Pyodide's loader requires. ESM workers cannot.
 *
 * The worker persists across runs; Pyodide loads once per page session.
 */

type CanonicalizationId = 'trim-trailing-newline' | 'trim-all' | 'exact';

interface RunMsg {
  type: 'run';
  code: string;
  requestId: string;
}

interface RunHiddenMsg {
  type: 'run-hidden';
  code: string;
  requestId: string;
  expectedOutputHash: string;
  canonicalization: CanonicalizationId;
}

type InMsg = RunMsg | RunHiddenMsg;

interface WorkerOutMsg {
  type: 'stdout' | 'stderr' | 'done' | 'error' | 'ready' | 'hidden-result';
  text?: string;
  requestId?: string;
  runtimeMs?: number;
  kind?: 'runtime' | 'syntax';
  passed?: boolean;
}

const postWorkerMessage = (msg: WorkerOutMsg) => self.postMessage(msg);

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
}

const PYODIDE_VERSION = '0.26.2';
const PYODIDE_BASE = `/pyodide/v${PYODIDE_VERSION}/`;

let pyodidePromise: Promise<PyodideInstance> | null = null;

async function loadPyodideOnce(): Promise<PyodideInstance> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    importScripts(`${PYODIDE_BASE}pyodide.js`);

    const loader = (
      self as unknown as {
        loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
      }
    ).loadPyodide;

    if (!loader) {
      throw new Error(
        'Pyodide loader missing after importScripts. Verify /pyodide/v0.26.2/pyodide.js exists in the built app.'
      );
    }

    return loader({ indexURL: PYODIDE_BASE });
  })();

  return pyodidePromise;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface PyExecution {
  ok: boolean;
  stdout: string;
  stderr: string;
  kind?: 'runtime' | 'syntax';
  runtimeMs: number;
}

async function executePython(
  py: PyodideInstance,
  code: string
): Promise<PyExecution> {
  const start = performance.now();
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  py.setStdout({ batched: (s) => stdoutChunks.push(s) });
  py.setStderr({ batched: (s) => stderrChunks.push(s) });

  try {
    await py.runPythonAsync(code);
    return {
      ok: true,
      stdout: stdoutChunks.join('\n'),
      stderr: stderrChunks.join('\n'),
      runtimeMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      ok: false,
      stdout: stdoutChunks.join('\n'),
      stderr: stderrChunks.join('\n') || msg,
      kind: msg.includes('SyntaxError') ? 'syntax' : 'runtime',
      runtimeMs: Math.round(performance.now() - start),
    };
  }
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const { requestId } = e.data;
  const start = performance.now();

  // Load Pyodide (shared across runs)
  let py: PyodideInstance;
  try {
    py = await loadPyodideOnce();
    postWorkerMessage({ type: 'ready', requestId });
  } catch (err) {
    postWorkerMessage({
      type: 'error',
      requestId,
      kind: 'runtime',
      text: `Pyodide load failed: ${err instanceof Error ? err.message : String(err)}`,
      runtimeMs: Math.round(performance.now() - start),
    });
    return;
  }

  if (e.data.type === 'run') {
    const result = await executePython(py, e.data.code);
    if (result.stdout)
      postWorkerMessage({ type: 'stdout', text: result.stdout, requestId });
    if (result.stderr && !result.ok)
      postWorkerMessage({
        type: 'stderr',
        text: result.stderr,
        requestId,
      });
    if (result.ok) {
      postWorkerMessage({
        type: 'done',
        requestId,
        runtimeMs: result.runtimeMs,
      });
    } else {
      postWorkerMessage({
        type: 'error',
        requestId,
        kind: result.kind ?? 'runtime',
        text: result.stderr,
        runtimeMs: result.runtimeMs,
      });
    }
    return;
  }

  if (e.data.type === 'run-hidden') {
    const result = await executePython(py, e.data.code);

    let passed = false;
    if (result.ok) {
      const canonical = canonicalize(result.stdout, e.data.canonicalization);
      const actualHash = await sha256Hex(canonical);
      passed = actualHash === e.data.expectedOutputHash;
    }

    postWorkerMessage({
      type: 'hidden-result',
      requestId,
      passed,
      runtimeMs: result.runtimeMs,
    });
  }
};