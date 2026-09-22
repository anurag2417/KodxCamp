import { runCode, type RunResult } from '@/shared/runner/index';

export type OutputMode = 'return' | 'print';

export interface VisibleTestCase {
  index: number;
  input: string;
  expectedOutput: string;
}

export interface VisibleTestResult {
  kind: 'visible';
  index: number;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  stderr?: string;
  runtimeMs: number;
}

export interface HiddenTestResult {
  kind: 'hidden';
  id: string;
  passed: boolean;
  runtimeMs: number;
}

export type AnyTestResult = VisibleTestResult | HiddenTestResult;

export interface TestRunSummary {
  results: AnyTestResult[];
  passedTests: number;
  totalTests: number;
  allPassed: boolean;
  totalRuntimeMs: number;
}

export interface TestHarnessOptions {
  functionName: string;
  outputMode: OutputMode;
}

export async function runTests(
  language: string,
  code: string,
  testCases: VisibleTestCase[],
  options: TestHarnessOptions
): Promise<TestRunSummary> {
  const results: VisibleTestResult[] = [];
  let totalRuntimeMs = 0;

  for (const tc of testCases) {
    const wrapped = wrapForExecution(language, code, tc.input, options);
    const result: RunResult = await runCode(language, wrapped, {
      timeoutMs: 10000,
    });

    totalRuntimeMs += result.runtimeMs;

    const actual = result.stdout;
    const passed =
      result.ok && outputsMatch(actual, tc.expectedOutput, options.outputMode);

    results.push({
      kind: 'visible',
      index: tc.index,
      passed,
      actualOutput: actual,
      expectedOutput: tc.expectedOutput,
      stderr: result.stderr,
      runtimeMs: result.runtimeMs,
    });
  }

  return {
    results,
    passedTests: results.filter((r) => r.passed).length,
    totalTests: results.length,
    allPassed: results.every((r) => r.passed),
    totalRuntimeMs,
  };
}

/**
 * Combine visible + hidden results into one summary.
 *
 * `hidden.results` is typed as `AnyTestResult[]` (rather than strictly
 * `HiddenTestResult[]`) so the caller can pass an intermediate object
 * that started life as `HiddenTestResult[]` and got widened. The
 * runtime shape is identical either way.
 */
export function combineSummaries(
  visible: TestRunSummary,
  hidden: { results: AnyTestResult[]; totalRuntimeMs: number }
): TestRunSummary {
  const results: AnyTestResult[] = [...visible.results, ...hidden.results];
  const passedTests = results.filter((r) => r.passed).length;
  return {
    results,
    passedTests,
    totalTests: results.length,
    allPassed: passedTests === results.length,
    totalRuntimeMs: visible.totalRuntimeMs + hidden.totalRuntimeMs,
  };
}

function outputsMatch(
  actual: string,
  expected: string,
  _mode: OutputMode
): boolean {
  const a = actual.trim().replace(/\r\n/g, '\n');
  const e = expected.trim().replace(/\r\n/g, '\n');

  if (a === e) return true;

  try {
    const pa = JSON.parse(a);
    const pe = JSON.parse(e);
    if (deepEqual(pa, pe)) return true;
  } catch {
    /* not JSON on one or both sides */
  }

  const na = Number(a);
  const ne = Number(e);
  if (!isNaN(na) && !isNaN(ne) && na === ne) return true;

  return false;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) =>
    deepEqual(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k]
    )
  );
}

function wrapForExecution(
  language: string,
  code: string,
  input: string,
  options: TestHarnessOptions
): string {
  if (options.outputMode === 'print') {
    return wrapPrintMode(language, code, input);
  }
  return wrapReturnMode(language, code, input, options.functionName);
}

function parseArgs(input: string): { args: unknown[]; isArgsArray: boolean } {
  const trimmed = input.trim();
  if (trimmed === '') return { args: [], isArgsArray: false };

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return { args: parsed, isArgsArray: true };
    }
    return { args: [parsed], isArgsArray: false };
  } catch {
    /* fall through */
  }

  try {
    const parsed = JSON.parse(`[${trimmed}]`);
    if (Array.isArray(parsed)) {
      return { args: parsed, isArgsArray: true };
    }
  } catch {
    /* fall through */
  }

  return { args: [trimmed], isArgsArray: false };
}

function serialize(value: unknown, language: string): string {
  if (language === 'python' || language === 'dsa-python') {
    const json = JSON.stringify(value);
    return json
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/\bnull\b/g, 'None');
  }
  return JSON.stringify(value);
}

function wrapReturnMode(
  language: string,
  code: string,
  input: string,
  functionName: string
): string {
  const { args } = parseArgs(input);

  if (
    language === 'javascript' ||
    language === 'typescript' ||
    language === 'dsa-javascript'
  ) {
    const argList = args.map((a) => JSON.stringify(a)).join(', ');
    return `${code}

// ── Auto-generated driver ────────────────────────────────
const __KODX_RESULT__ = ${functionName}(${argList});
console.log(JSON.stringify(__KODX_RESULT__));
`;
  }

  if (language === 'python' || language === 'dsa-python') {
    const argList = args.map((a) => serialize(a, language)).join(', ');
    return `${code}

# ── Auto-generated driver ───────────────────────────────
import json as __json__
__KODX_RESULT__ = ${functionName}(${argList})
print(__json__.dumps(__KODX_RESULT__, separators=(',', ':')))
`;
  }

  return code;
}

function wrapPrintMode(
  language: string,
  code: string,
  input: string
): string {
  const { args } = parseArgs(input);

  if (
    language === 'javascript' ||
    language === 'typescript' ||
    language === 'dsa-javascript'
  ) {
    if (args.length === 0) return code;
    const argList = args.map((a) => JSON.stringify(a)).join(', ');
    return `const __input__ = ${
      args.length === 1 ? JSON.stringify(args[0]) : `[${argList}]`
    };
${code}
`;
  }

  if (language === 'python' || language === 'dsa-python') {
    if (args.length === 0) return code;
    const argList = args.map((a) => serialize(a, language)).join(', ');
    return `__input__ = ${
      args.length === 1 ? serialize(args[0], language) : `[${argList}]`
    }
${code}
`;
  }

  return code;
}