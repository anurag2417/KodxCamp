import type { RunResult } from './types';
import { runJava, runJavaHidden, preloadJava, isJavaReady } from './javaRuntime';

/**
 * Main-thread Java runner.
 *
 * Unlike JS, Python, and Ruby, Java does not run in a Web Worker.
 * CheerpJ requires DOM access and its API is not Worker-safe.
 *
 * This means stdout briefly exists on the main thread before being
 * returned to the caller. For visible tests that's fine — the student
 * already sees their own output. For hidden tests, we fail closed.
 */

export { preloadJava, isJavaReady };

export async function runJavaCode(
  code: string,
  _opts: { timeoutMs?: number } = {}
): Promise<RunResult> {
  const result = await runJava(code);

  if (result.ok) {
    return {
      ok: true,
      stdout: result.stdout,
      stderr: result.stderr,
      verdict: 'accepted',
      runtimeMs: result.runtimeMs,
    };
  }

  return {
    ok: false,
    stdout: result.stdout,
    stderr: result.stderr,
    verdict: result.kind === 'syntax' ? 'compile_error' : 'runtime_error',
    runtimeMs: result.runtimeMs,
  };
}

export async function runJavaHiddenCode(): Promise<{
  passed: boolean;
  runtimeMs: number;
}> {
  return runJavaHidden();
}