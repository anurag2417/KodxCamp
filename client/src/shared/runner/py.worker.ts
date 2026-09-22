/// <reference lib="webworker" />

/**
 * Python sandbox worker — runs Pyodide off the main thread.
 *
 * Two modes:
 *  - `run`        — visible test / playground. Returns raw stdout.
 *  - `run-hidden` — hidden test. Hashes the output inside the worker
 *                   and posts back only `{ passed }`.
 *
 * Pyodide is loaded from the official jsDelivr full distribution. The
 * `full/` alias includes the standard library zip, the lockfile, and
 * the built-in package index, so imports like `import numpy` work after
 * `loadPackagesFromImports`.
 *
 * This worker must not use `importScripts`: Vite 5 emits module workers
 * even when `worker.format: 'iife'` is set, and `importScripts` is
 * disallowed in module workers. We load Pyodide's ESM entry point via a
 * runtime-fetched Blob URL.
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

const PYODIDE_VERSION = '0.26.2';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// ─── Inlined canonicalization ─────────────────────────────────────
//
// Mirrors `shared/src/testcase/canonicalize.ts`. Inlined because a
// module worker cannot import from a workspace package without extra
// runtime fetches. Keep these rules in sync with the shared copy.

function canonicalize(
  output: string,
  id: CanonicalizationId = 'trim-trailing-newline'
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

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Pyodide lifecycle ────────────────────────────────────────────

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
}

let pyodidePromise: Promise<PyodideInstance> | null = null;

async function loadPyodideOnce(): Promise<PyodideInstance> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    const pyodideUrl = `${PYODIDE_BASE}pyodide.mjs`;

    const response = await fetch(pyodideUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${pyodideUrl}: ${response.status} ${response.statusText}`
      );
    }

    const source = await response.text();
    const blob = new Blob([source], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    let mod: {
      loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
    };
    try {
      mod = (await import(/* @vite-ignore */ blobUrl)) as typeof mod;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }

    if (typeof mod.loadPyodide !== 'function') {
      throw new Error(
        `Pyodide ESM loader not found at ${pyodideUrl}. Verify the CDN URL.`
      );
    }

    return mod.loadPyodide({ indexURL: PYODIDE_BASE });
  })();

  return pyodidePromise;
}

// ─── Execution ────────────────────────────────────────────────────

interface PyExecution {
  ok: boolean;
  stdout: string;
  stderr: string;
  kind?: 'runtime' | 'syntax';
  runtimeMs: number;
}

/**
 * Execute Python code and capture stdout/stderr.
 *
 * Before running, we call `loadPackagesFromImports` so the student's
 * `import numpy` (or `from sympy import ...`) automatically pulls the
 * matching Pyodide package. `loadPackagesFromImports` is cheap on
 * repeated calls — Pyodide tracks which packages are already loaded.
 */
async function executePython(
  py: PyodideInstance,
  code: string
): Promise<PyExecution> {
  const start = performance.now();
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  py.setStdout({ batched: (s) => stdoutChunks.push(s) });
  py.setStderr({ batched: (s) => stderrChunks.push(s) });

  // Auto-install any packages the code imports. Pyodide knows the
  // list of built-in packages (numpy, pandas, scipy, etc.); anything
  // it can't resolve is left for the import to fail naturally so the
  // student sees a clear ModuleNotFoundError.
  try {
    await py.loadPackagesFromImports(code);
  } catch {
    /* non-fatal — imports will fail at runtime if truly missing */
  }

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

// ─── Message handling ─────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const { requestId } = e.data;
  const start = performance.now();

  let py: PyodideInstance;
  try {
    py = await loadPyodideOnce();
    postWorkerMessage({ type: 'ready', requestId });
  } catch (err) {
    postWorkerMessage({
      type: 'error',
      requestId,
      kind: 'runtime',
      text: `Pyodide load failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
      runtimeMs: Math.round(performance.now() - start),
    });
    return;
  }

  if (e.data.type === 'run') {
    const result = await executePython(py, e.data.code);
    if (result.stdout)
      postWorkerMessage({ type: 'stdout', text: result.stdout, requestId });
    if (result.stderr && !result.ok)
      postWorkerMessage({ type: 'stderr', text: result.stderr, requestId });
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