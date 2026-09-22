import type { RunResult, RunnerOptions } from '@/shared/runner/types';

/**
 * Run JavaScript for a visible test / playground. Returns the full
 * `RunResult` including stdout.
 */
export async function runJavaScript(
  code: string,
  opts: RunnerOptions = {}
): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? 5000;

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
        const verdict = msg.kind === 'syntax' ? 'compile_error' : 'runtime_error';
        finish({
          ok: false,
          stdout,
          stderr: msg.text,
          verdict,
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

/**
 * Run JavaScript for a hidden test.
 *
 * The worker hashes the output internally and returns only a boolean.
 * Raw stdout never crosses the worker boundary.
 *
 * @returns `{ passed, runtimeMs }` — no stdout, no stderr.
 */
export async function runJavaScriptHidden(
  code: string,
  expectedOutputHash: string,
  canonicalization: 'trim-trailing-newline' | 'trim-all' | 'exact',
  opts: RunnerOptions = {}
): Promise<{ passed: boolean; runtimeMs: number }> {
  const timeoutMs = opts.timeoutMs ?? 5000;

  const WorkerCtor = (await import('./js.worker?worker')).default;
  const worker = new WorkerCtor();

  return new Promise((resolve) => {
    let finished = false;
    const requestId = `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const finish = (passed: boolean, runtimeMs: number) => {
      if (finished) return;
      finished = true;
      worker.terminate();
      resolve({ passed, runtimeMs });
    };

    const timer = setTimeout(() => {
      finish(false, timeoutMs);
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'hidden-result' && msg.requestId === requestId) {
        clearTimeout(timer);
        finish(Boolean(msg.passed), msg.runtimeMs ?? 0);
      }
      // Ignore 'stdout' / 'done' / 'error' — the hidden worker shouldn't
      // produce them, and if it does, we deliberately drop them.
    };

    worker.onerror = () => {
      clearTimeout(timer);
      finish(false, 0);
    };

    worker.postMessage({
      type: 'run-hidden',
      requestId,
      code,
      expectedOutputHash,
      canonicalization,
    });
  });
}