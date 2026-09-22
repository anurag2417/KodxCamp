import type { RunResult, RunnerOptions } from './types';

type CanonicalizationId = 'trim-trailing-newline' | 'trim-all' | 'exact';

type WorkerMessage = {
  type: 'stdout' | 'stderr' | 'done' | 'error' | 'ready' | 'hidden-result';
  text?: string;
  requestId?: string;
  runtimeMs?: number;
  kind?: 'runtime' | 'syntax';
  passed?: boolean;
};

interface PendingRun {
  resolve: (result: RunResult) => void;
  stdout: string;
  stderr: string;
  timeoutId: number;
  startedAt: number;
}

interface PendingHidden {
  resolve: (result: { passed: boolean; runtimeMs: number }) => void;
  timeoutId: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

let worker: Worker | null = null;
const pending: Map<string, PendingRun> = new Map();
const pendingHidden: Map<string, PendingHidden> = new Map();

let workerCtorPromise: Promise<new () => Worker> | null = null;

async function getWorkerCtor(): Promise<new () => Worker> {
  if (!workerCtorPromise) {
    workerCtorPromise = import('./py.worker?worker').then(
      (m) => m.default as new () => Worker
    );
  }
  return workerCtorPromise;
}

function attachListeners(w: Worker) {
  w.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;
    if (!msg.requestId) return;

    // Hidden-test path
    const hidden = pendingHidden.get(msg.requestId);
    if (hidden && msg.type === 'hidden-result') {
      clearTimeout(hidden.timeoutId);
      pendingHidden.delete(msg.requestId);
      hidden.resolve({
        passed: Boolean(msg.passed),
        runtimeMs: msg.runtimeMs ?? 0,
      });
      return;
    }

    // Visible-test path
    const run = pending.get(msg.requestId);
    if (!run) return;

    if (msg.type === 'stdout' && typeof msg.text === 'string') {
      run.stdout += (run.stdout ? '\n' : '') + msg.text;
    } else if (msg.type === 'stderr' && typeof msg.text === 'string') {
      run.stderr += (run.stderr ? '\n' : '') + msg.text;
    } else if (msg.type === 'done') {
      clearTimeout(run.timeoutId);
      pending.delete(msg.requestId);
      run.resolve({
        ok: true,
        stdout: run.stdout,
        stderr: run.stderr,
        verdict: 'accepted',
        runtimeMs: msg.runtimeMs ?? 0,
      });
    } else if (msg.type === 'error') {
      clearTimeout(run.timeoutId);
      pending.delete(msg.requestId);
      const verdict =
        msg.kind === 'syntax' ? 'compile_error' : 'runtime_error';
      run.resolve({
        ok: false,
        stdout: run.stdout,
        stderr: run.stderr || msg.text || 'Runtime error',
        verdict,
        runtimeMs: msg.runtimeMs ?? 0,
      });
    }
  });

  w.addEventListener('error', (err) => {
    try {
      w.terminate();
    } catch {
      /* ignore */
    }
    if (worker === w) worker = null;
    for (const [id, run] of pending) {
      clearTimeout(run.timeoutId);
      pending.delete(id);
      run.resolve({
        ok: false,
        stdout: run.stdout,
        stderr: err.message || 'Worker error',
        verdict: 'runtime_error',
        runtimeMs: 0,
      });
    }
    for (const [id, h] of pendingHidden) {
      clearTimeout(h.timeoutId);
      pendingHidden.delete(id);
      h.resolve({ passed: false, runtimeMs: 0 });
    }
  });
}

async function ensureWorker(): Promise<Worker> {
  if (worker) return worker;
  const Ctor = await getWorkerCtor();
  worker = new Ctor();
  attachListeners(worker);
  return worker;
}

export async function preloadPython(): Promise<void> {
  try {
    const w = await ensureWorker();
    const id = `__preload__${Date.now()}`;
    const timer = setTimeout(() => {
      pending.delete(id);
    }, 20_000);

    pending.set(id, {
      stdout: '',
      stderr: '',
      startedAt: performance.now(),
      timeoutId: timer as unknown as number,
      resolve: () => {
        clearTimeout(timer);
      },
    });

    w.postMessage({ type: 'run', code: 'pass', requestId: id });
  } catch {
    /* Non-fatal */
  }
}

export function isPythonReady(): boolean {
  return worker !== null;
}

export async function runPython(
  code: string,
  opts: RunnerOptions = {}
): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const w = await ensureWorker();

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise<RunResult>((resolve) => {
    const timer = window.setTimeout(() => {
      pending.delete(requestId);
      try {
        w.terminate();
      } catch {
        /* ignore */
      }
      if (worker === w) worker = null;
      resolve({
        ok: false,
        stdout: '',
        stderr: `Time limit exceeded (${timeoutMs}ms)`,
        verdict: 'time_limit_exceeded',
        runtimeMs: timeoutMs,
      });
    }, timeoutMs);

    pending.set(requestId, {
      stdout: '',
      stderr: '',
      startedAt: performance.now(),
      timeoutId: timer,
      resolve,
    });

    w.postMessage({ type: 'run', code, requestId });
  });
}

export async function runPythonHidden(
  code: string,
  expectedOutputHash: string,
  canonicalization: CanonicalizationId,
  opts: RunnerOptions = {}
): Promise<{ passed: boolean; runtimeMs: number }> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const w = await ensureWorker();
  const requestId = `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pendingHidden.delete(requestId);
      try {
        w.terminate();
      } catch {
        /* ignore */
      }
      if (worker === w) worker = null;
      resolve({ passed: false, runtimeMs: timeoutMs });
    }, timeoutMs);

    pendingHidden.set(requestId, {
      timeoutId: timer,
      resolve,
    });

    w.postMessage({
      type: 'run-hidden',
      code,
      requestId,
      expectedOutputHash,
      canonicalization,
    });
  });
}