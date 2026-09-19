import type { RunResult, RunnerOptions } from './types';

/**
 * Runs Python code in a dedicated Web Worker.
 *
 * The worker loads Pyodide (WASM CPython). On timeout we terminate the
 * worker — this kills running code even inside infinite loops. The next
 * call spawns a fresh worker.
 */
export async function runPython(
  code: string,
  opts: RunnerOptions = {}
): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? 10_000;

  const WorkerCtor = (await import('./py.worker?worker')).default;
  const worker = new WorkerCtor();

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise<RunResult>((resolve) => {
    let stdout = '';
    let stderr = '';
    let finished = false;

    const finish = (result: RunResult) => {
      if (finished) return;
      finished = true;
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        stdout,
        stderr: stderr || `Time limit exceeded (${timeoutMs}ms)`,
        verdict: 'time_limit_exceeded',
        runtimeMs: timeoutMs,
      });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.requestId !== requestId) return;

      if (msg.type === 'stdout' && typeof msg.text === 'string') {
        stdout += (stdout ? '\n' : '') + msg.text;
      } else if (msg.type === 'stderr' && typeof msg.text === 'string') {
        stderr += (stderr ? '\n' : '') + msg.text;
      } else if (msg.type === 'done') {
        clearTimeout(timer);
        finish({
          ok: true,
          stdout,
          stderr,
          verdict: 'accepted',
          runtimeMs: msg.runtimeMs ?? 0,
        });
      } else if (msg.type === 'error') {
        clearTimeout(timer);
        const verdict =
          msg.kind === 'syntax' ? 'compile_error' : 'runtime_error';
        finish({
          ok: false,
          stdout,
          stderr: stderr || msg.text || 'Runtime error',
          verdict,
          runtimeMs: msg.runtimeMs ?? 0,
        });
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      finish({
        ok: false,
        stdout,
        stderr: err.message || 'Worker error',
        verdict: 'runtime_error',
        runtimeMs: 0,
      });
    };

    worker.postMessage({ type: 'run', code, requestId });
  });
}