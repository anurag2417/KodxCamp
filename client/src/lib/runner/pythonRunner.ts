import type { RunResult, RunnerOptions } from './types';

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
}

let pyodidePromise: Promise<PyodideInstance> | null = null;

async function getPyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const mod = await import('pyodide');
      const py = await mod.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
      });
      return py as unknown as PyodideInstance;
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

  // Pyodide doesn't have a native timeout — race it
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