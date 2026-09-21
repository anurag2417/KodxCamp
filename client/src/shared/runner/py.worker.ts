/// <reference lib="webworker" />

/**
 * Python sandbox worker — runs Pyodide off the main thread.
 *
 * The parent terminates this worker on timeout, which kills running code
 * even inside `while True: pass`.
 */

interface RunMsg {
  type: 'run';
  code: string;
  requestId: string;
}

export interface OutMsg {
  type: 'stdout' | 'stderr' | 'done' | 'error';
  text?: string;
  requestId?: string;
  runtimeMs?: number;
  kind?: 'runtime' | 'syntax';
}

const post = (msg: OutMsg) => (self as unknown as Worker).postMessage(msg);

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
    const mod = await import(
      /* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`
    );
    const loadPyodide = (mod as { loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance> }).loadPyodide;
    const py = await loadPyodide({ indexURL: PYODIDE_BASE });
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
  } catch (err) {
    post({
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
    if (stdout) post({ type: 'stdout', text: stdout, requestId });

    const stderr = stderrChunks.join('\n');
    if (stderr) post({ type: 'stderr', text: stderr, requestId });

    post({
      type: 'done',
      requestId,
      runtimeMs: Math.round(performance.now() - start),
    });
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const isSyntax = msg.includes('SyntaxError');

    const stdout = stdoutChunks.join('\n');
    if (stdout) post({ type: 'stdout', text: stdout, requestId });

    post({
      type: 'error',
      requestId,
      kind: isSyntax ? 'syntax' : 'runtime',
      text: msg,
      runtimeMs: Math.round(performance.now() - start),
    });
  }
};
