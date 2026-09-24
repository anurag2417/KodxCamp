import type { RunResult } from './types';
import { runJava, preloadJava, isJavaReady } from './javaRuntime';

/**
 * Main-thread Java runner.
 *
 * Unlike JS, Python, and Ruby, Java does not run in a Web Worker.
 * CheerpJ requires DOM access and its API is not Worker-safe.
 */

export { preloadJava, isJavaReady };

export async function runJavaCode(
  code: string,
  _opts: { timeoutMs?: number } = {}
): Promise<RunResult> {
  const result = await runJava(ensureJavaEntryPoint(code));

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

function ensureJavaEntryPoint(code: string): string {
  if (/\bclass\s+KodxEntry\b/.test(code)) return code;

  return `${code}

class KodxEntry {
  public static void main(String[] args) throws Exception {
    System.out.println("<<<KODX_OUTPUT>>>");
    try {
      Main.main(args);
    } finally {
      System.out.println("<<<KODX_END>>>");
    }
  }
}
`;
}