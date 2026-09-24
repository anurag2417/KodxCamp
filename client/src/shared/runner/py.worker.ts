/// <reference lib="webworker" />

/**
 * Python sandbox worker - runs Pyodide off the main thread.
 *
 * This worker must not use `importScripts`: Vite 5 emits module workers
 * even when `worker.format: 'iife'` is set, and `importScripts` is
 * disallowed in module workers. We load Pyodide's ESM entry point via a
 * runtime-fetched Blob URL, matching the pattern in ruby.worker.ts.
 *
 * The worker persists across runs; Pyodide loads once per page session.
 */

interface RunMsg {
  type: 'run';
  code: string;
  requestId: string;
}

interface WorkerOutMsg {
  type: 'stdout' | 'stderr' | 'done' | 'error' | 'ready';
  text?: string;
  requestId?: string;
  runtimeMs?: number;
  kind?: 'runtime' | 'syntax';
}

const postWorkerMessage = (msg: WorkerOutMsg) => self.postMessage(msg);

const PYODIDE_VERSION = '0.26.2';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

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
    await py.loadPackagesFromImports(code);
  } catch {
    /* non-fatal - imports fail at runtime if truly missing */
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

self.onmessage = async (e: MessageEvent<RunMsg>) => {
  if (e.data.type !== 'run') return;

  const { code, requestId } = e.data;
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

  const result = await executePython(py, code);
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
};