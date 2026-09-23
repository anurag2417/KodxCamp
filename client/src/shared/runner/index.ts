import type { RunResult, RunnerOptions } from './types';
import { getAdapter } from './adapters';

export type { RunResult, RunnerOptions, Verdict } from './types';
export {
  runHiddenTests,
  type HiddenTestCase,
  type HiddenTestOutcome,
  type HiddenRunOptions,
} from './hiddenHarness';
export { getAdapter, listAdapters } from './adapters';
export type { RunnerAdapter } from './adapters';

/**
 * Run code in the appropriate in-browser runtime.
 *
 * The caller is responsible for wrapping the code (injecting input,
 * adding a driver that calls the student's function) before passing it
 * here. `runTests` in `testHarness.ts` does this for visible tests;
 * `runHiddenTests` in `hiddenHarness.ts` does it for hidden tests.
 *
 * Languages supported today:
 *   javascript, dsa-javascript, typescript
 *   python, dsa-python
 *   sql
 *   html-css, tailwind, react
 *
 * Java and Ruby are in progress.
 */
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
    timeoutMs: opts.timeoutMs ?? 10000,
    stdin: opts.stdin,
  });
}