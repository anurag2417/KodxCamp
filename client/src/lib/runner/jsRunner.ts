import type { RunResult, RunnerOptions } from './types';

export async function runJavaScript(
  code: string,
  opts: RunnerOptions = {}
): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? 5000;

  // Vite bundles this worker correctly via `?worker`
  const WorkerCtor = (await import('./js.worker?worker')).default;
  const worker = new WorkerCtor();

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
      if (msg.type === 'stdout') {
        stdout += (stdout ? '\n' : '') + msg.text;
      } else if (msg.type === 'stderr') {
        stderr += (stderr ? '\n' : '') + msg.text;
      } else if (msg.type === 'done') {
        clearTimeout(timer);
        finish({
          ok: true,
          stdout,
          stderr,
          verdict: 'accepted',
          runtimeMs: msg.runtimeMs,
        });
      } else if (msg.type === 'error') {
        clearTimeout(timer);
        finish({
          ok: false,
          stdout,
          stderr: msg.text,
          verdict: 'runtime_error',
          runtimeMs: msg.runtimeMs,
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

    worker.postMessage({ type: 'run', code });
  });
}