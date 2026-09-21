import type { RunResult } from '@/shared/runner/types';

/**
 * Runs HTML in an isolated sandboxed iframe.
 * Returns the extracted plain text (used for auto-grading simple lessons).
 */
export async function runHtml(code: string): Promise<RunResult> {
  const start = performance.now();
  return new Promise<RunResult>((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {
        /* ignore */
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        ok: false,
        stdout: '',
        stderr: 'HTML render timed out',
        verdict: 'time_limit_exceeded',
        runtimeMs: Math.round(performance.now() - start),
      });
    }, 3000);

    iframe.onload = () => {
      clearTimeout(timer);
      try {
        const doc = iframe.contentDocument;
        const text = doc?.body?.innerText?.trim() ?? '';
        cleanup();
        resolve({
          ok: true,
          stdout: text,
          stderr: '',
          verdict: 'accepted',
          runtimeMs: Math.round(performance.now() - start),
        });
      } catch (err) {
        cleanup();
        resolve({
          ok: false,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'HTML error',
          verdict: 'runtime_error',
          runtimeMs: Math.round(performance.now() - start),
        });
      }
    };

    iframe.srcdoc = code;
  });
}
