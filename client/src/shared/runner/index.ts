import type { RunResult, RunnerOptions } from '@/shared/runner/types';
import { runJavaScript } from '@/shared/runner/jsRunner';
import { runPython } from '@/shared/runner/pythonRunner';
import { runSql } from '@/shared/runner/sqlRunner';
import { runHtml } from '@/shared/runner/htmlRunner';

export type { RunResult, RunnerOptions, Verdict } from '@/shared/runner/types';
export {
  runHiddenTests,
  type HiddenTestCase,
  type HiddenTestOutcome,
  type HiddenRunOptions,
} from '@/shared/runner/hiddenHarness';

export async function runCode(
  language: string,
  code: string,
  opts: RunnerOptions = {}
): Promise<RunResult> {
  switch (language) {
    case 'javascript':
    case 'dsa-javascript':
      return runJavaScript(code, opts);

    case 'typescript': {
      const stripped = code
        .replace(/:\s*[A-Za-z_][A-Za-z0-9_<>[\]|&\s]*(?=[=;,)\n])/g, '')
        .replace(/\bas\s+[A-Za-z_][A-Za-z0-9_<>[\]|&\s]*/g, '');
      return runJavaScript(stripped, opts);
    }

    case 'python':
    case 'dsa-python':
      return runPython(code, opts);

    case 'sql':
      return runSql(code, opts);

    case 'html-css':
    case 'tailwind':
    case 'react':
      return runHtml(code);

    default:
      return {
        ok: false,
        stdout: '',
        stderr: `Language "${language}" is not supported.`,
        verdict: 'unsupported',
        runtimeMs: 0,
      };
  }
}