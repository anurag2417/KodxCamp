import { getAdapter } from './adapters';
import type { RunnerAdapter } from './adapters';

/**
 * Language preload manager.
 *
 * Warms up language runtimes in the background so the first Run/Submit
 * is fast. Warming is expensive (Java downloads ~30 MB, Python ~15 MB,
 * Ruby ~15 MB), so we:
 *
 *   - Warm one language at a time, never in parallel (bandwidth).
 *   - Prefer `requestIdleCallback` so typing and scrolling stay smooth.
 *   - Let the page prioritise: the language the user is likely to pick
 *     next goes to the front of the queue.
 *   - De-duplicate: warming the same language twice is a no-op.
 *
 * This module is intentionally framework-agnostic. React consumers use
 * `useLanguagePreload` below.
 */

export type PreloadStatus = 'idle' | 'pending' | 'loading' | 'ready' | 'error';

interface PreloadState {
  status: PreloadStatus;
  error?: string;
}

const statusByLanguage = new Map<string, PreloadState>();
const listeners = new Set<() => void>();

let queue: string[] = [];
let running = false;

/**
 * Subscribe to status changes. Returns an unsubscribe function.
 */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn();
}

/**
 * Read the current status for a language. Returns `idle` if we've never
 * seen it, which the UI can treat as "not warmed yet".
 */
export function getPreloadStatus(language: string): PreloadStatus {
  return statusByLanguage.get(language)?.status ?? 'idle';
}

/**
 * Read the error message, if any.
 */
export function getPreloadError(language: string): string | undefined {
  return statusByLanguage.get(language)?.error;
}

/**
 * Add a language to the preload queue.
 *
 * @param language   the canonical language id (e.g. `java`, `python`)
 * @param priority   `front` jumps the queue; `back` (default) appends.
 */
export function queuePreload(
  language: string,
  priority: 'front' | 'back' = 'back'
): void {
  const adapter = getAdapter(language);
  if (!adapter?.init) {
    // Nothing to warm (JS, SQL, HTML). Mark as ready immediately.
    setStatus(language, { status: 'ready' });
    return;
  }

  if (adapter.isReady()) {
    setStatus(language, { status: 'ready' });
    return;
  }

  const current = statusByLanguage.get(language);
  if (current?.status === 'loading' || current?.status === 'pending') {
    // Already queued or loading. Bump priority if asked.
    if (priority === 'front' && queue.includes(language)) {
      queue = [language, ...queue.filter((l) => l !== language)];
    }
    return;
  }

  // Remove any existing entry so we can re-insert at the right spot.
  queue = queue.filter((l) => l !== language);
  if (priority === 'front') {
    queue.unshift(language);
  } else {
    queue.push(language);
  }

  setStatus(language, { status: 'pending' });
  scheduleNext();
}

/**
 * Warm a language immediately, ignoring the queue. Used by the hook on
 * explicit user action (clicking the tab).
 */
export async function preloadNow(language: string): Promise<void> {
  const adapter = getAdapter(language);
  if (!adapter?.init) {
    setStatus(language, { status: 'ready' });
    return;
  }
  if (adapter.isReady()) {
    setStatus(language, { status: 'ready' });
    return;
  }

  // Remove from queue; we'll run it now.
  queue = queue.filter((l) => l !== language);

  setStatus(language, { status: 'loading' });
  try {
    await adapter.init();
    setStatus(language, { status: 'ready' });
  } catch (err) {
    setStatus(language, {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    scheduleNext();
  }
}

function setStatus(language: string, state: PreloadState): void {
  const prev = statusByLanguage.get(language);
  if (prev?.status === state.status && prev?.error === state.error) return;
  statusByLanguage.set(language, state);
  emit();
}

// ─── Scheduler ────────────────────────────────────────────────────

/**
 * Schedule the next queued warm-up during an idle window. If the
 * browser doesn't support `requestIdleCallback`, fall back to a short
 * `setTimeout`.
 */
function scheduleNext(): void {
  if (running) return;
  if (queue.length === 0) return;

  running = true;

  const run = () => {
    const next = queue.shift();
    if (!next) {
      running = false;
      return;
    }
    void runOne(next);
  };

  if (typeof (window as unknown as { requestIdleCallback?: unknown }).requestIdleCallback === 'function') {
    (
      window as unknown as {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 200);
  }
}

async function runOne(language: string): Promise<void> {
  const adapter: RunnerAdapter | undefined = getAdapter(language);
  if (!adapter?.init) {
    setStatus(language, { status: 'ready' });
    running = false;
    scheduleNext();
    return;
  }

  setStatus(language, { status: 'loading' });
  try {
    await adapter.init();
    setStatus(language, { status: 'ready' });
  } catch (err) {
    setStatus(language, {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    running = false;
    // Small delay between languages so we don't saturate the network
    // back-to-back.
    setTimeout(scheduleNext, 1000);
  }
}