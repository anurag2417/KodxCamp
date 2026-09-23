import type { RunResult, RunnerOptions } from './types';
import { getAdapter } from './adapters';

export type { RunResult, RunnerOptions, Verdict } from './types';
export { getAdapter, listAdapters } from './adapters';
export type { RunnerAdapter } from './adapters';

export async function runCode(
  language: string,
  code: string,
  opts: RunnerOptions = {}
): Promise<RunResult> {
  const adapter = getAdapter(language);

  if (!adapter) {
    return {
      ok: false,
      stdout: '',
      stderr: `Language "${language}" is not supported.`,
      verdict: 'unsupported',
      runtimeMs: 0,
    };
  }

  return adapter.run(code, '', {
    timeoutMs: opts.timeoutMs ?? 30000,
    stdin: opts.stdin,
  });
}