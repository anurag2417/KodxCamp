/// <reference lib="webworker" />

/**
 * Python sandbox worker — runs Pyodide off the main thread.
 *
 * This worker is bundled as a *classic* worker (see vite.config.ts →
 * `worker.format: 'iife'`). Classic workers can use `importScripts`,
 * which Pyodide's loader requires. ESM workers cannot.
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
    // Load the Pyodide script tag into the worker's global scope.
    // After this, `loadPyodide` is available on `self`.
    importScripts(`${PYODIDE_BASE}pyodide.js`);

    const loader = (self as unknown as {
      loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
    }).loadPyodide;

    if (!loader) {
      throw new Error(
        'Pyodide loader missing after importScripts. Verify /pyodide/v0.26.2/pyodide.js exists in the built app.'
      );
    }

    const py = await loader({ indexURL: PYODIDE_BASE });
    return py;
  })();

  return pyodidePromise;
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
      text: `Pyodide load failed: ${err instanceof Error ? err.message : String(err)}`,
      runtimeMs: Math.round(performance.now() - start),
    });
    return;
  }

  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  py.setStdout({ batched: (s) => stdoutChunks.push(s) });
  py.setStderr({ batched: (s) => stderrChunks.push(s) });

  try {
    await py.runPythonAsync(code);

    const stdout = stdoutChunks.join('\n');
    if (stdout) postWorkerMessage({ type: 'stdout', text: stdout, requestId });

    const stderr = stderrChunks.join('\n');
    if (stderr) postWorkerMessage({ type: 'stderr', text: stderr, requestId });

    postWorkerMessage({
      type: 'done',
      requestId,
      runtimeMs: Math.round(performance.now() - start),
    });
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const isSyntax = msg.includes('SyntaxError');

    const stdout = stdoutChunks.join('\n');
    if (stdout) postWorkerMessage({ type: 'stdout', text: stdout, requestId });

    postWorkerMessage({
      type: 'error',
      requestId,
      kind: isSyntax ? 'syntax' : 'runtime',
      text: msg,
      runtimeMs: Math.round(performance.now() - start),
    });
  }
};