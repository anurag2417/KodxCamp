import type { RunResult, RunnerOptions } from './types';

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
}

const PYODIDE_VERSION = '0.26.2';
const PYODIDE_BASE = `/pyodide/v${PYODIDE_VERSION}/`;

let pyodidePromise: Promise<PyodideInstance> | null = null;

async function getPyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      // Load the runtime script from our own origin (public/pyodide/v0.26.2/)
      // Vite serves it with correct MIME in dev; Express serves it in prod.
      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as { loadPyodide?: unknown }).loadPyodide) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = `${PYODIDE_BASE}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error('Failed to load Pyodide runtime script'));
        document.head.appendChild(script);
      });

      const loadPyodide = (
        window as unknown as {
          loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
        }
      ).loadPyodide;

      const py = await loadPyodide({ indexURL: PYODIDE_BASE });
      return py;
    })();
  }
  return pyodidePromise;
}

export async function runPython(
  code: string,
  opts: RunnerOptions = {}
): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const start = performance.now();

  const py = await getPyodide();

  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  py.setStdout({ batched: (s) => stdoutChunks.push(s) });
  py.setStderr({ batched: (s) => stderrChunks.push(s) });

  const timeoutPromise = new Promise<'__timeout__'>((resolve) =>
    setTimeout(() => resolve('__timeout__'), timeoutMs)
  );

  try {
    const result = await Promise.race([py.runPythonAsync(code), timeoutPromise]);
    const runtimeMs = Math.round(performance.now() - start);

    if (result === '__timeout__') {
      return {
        ok: false,
        stdout: stdoutChunks.join('\n'),
        stderr: `Time limit exceeded (${timeoutMs}ms)`,
        verdict: 'time_limit_exceeded',
        runtimeMs,
      };
    }

    return {
      ok: true,
      stdout: stdoutChunks.join('\n'),
      stderr: stderrChunks.join('\n'),
      verdict: 'accepted',
      runtimeMs,
    };
  } catch (err) {
    const runtimeMs = Math.round(performance.now() - start);
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      ok: false,
      stdout: stdoutChunks.join('\n'),
      stderr: stderrChunks.join('\n') + (stderrChunks.length ? '\n' : '') + msg,
      verdict: 'runtime_error',
      runtimeMs,
    };
  }
}