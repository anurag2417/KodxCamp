import { runCode, type RunResult } from '@/shared/runner/index';

export type OutputMode = 'return' | 'print';

export interface TestCase {
  index: number;
  input: string;
  expectedOutput: string;
}

export interface TestResult {
  index: number;
  passed: boolean;
  actualOutput?: string;
  stderr?: string;
  runtimeMs: number;
}

export interface TestRunSummary {
  results: TestResult[];
  passedTests: number;
  totalTests: number;
  allPassed: boolean;
  totalRuntimeMs: number;
}

export interface TestHarnessOptions {
  /** Name of the function the student implements. */
  functionName: string;
  /** Whether to compare the function's return value, or stdout. */
  outputMode: OutputMode;
}

export async function runTests(
  language: string,
  code: string,
  testCases: TestCase[],
  options: TestHarnessOptions
): Promise<TestRunSummary> {
  const results: TestResult[] = [];
  let totalRuntimeMs = 0;

  for (const tc of testCases) {
    const wrapped = wrapForExecution(language, code, tc.input, options);
    const result = await runCode(language, wrapped, { timeoutMs: 5000 });

    totalRuntimeMs += result.runtimeMs;

    const actual = options.outputMode === 'return' ? result.stdout : result.stdout;
    const passed =
      result.ok && outputsMatch(actual, tc.expectedOutput, options.outputMode);

    results.push({
      index: tc.index,
      passed,
      actualOutput: actual,
      stderr: result.stderr,
      runtimeMs: result.runtimeMs,
    });
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    results,
    passedTests,
    totalTests: testCases.length,
    allPassed: passedTests === testCases.length,
    totalRuntimeMs,
  };
}

/**
 * Compare the runner's output against expected.
 *
 * Rules:
 *  1. Exact string match after trimming and normalizing line endings.
 *  2. If both parse as JSON, deep-equal comparison (so `[0,1]` === `[0, 1]`).
 *  3. If both parse as numbers, numeric equality.
 *  4. Otherwise, trimmed string equality.
 */
function outputsMatch(
  actual: string,
  expected: string,
  _mode: OutputMode
): boolean {
  const a = actual.trim().replace(/\r\n/g, '\n');
  const e = expected.trim().replace(/\r\n/g, '\n');

  if (a === e) return true;

  // Try JSON deep-equal
  try {
    const pa = JSON.parse(a);
    const pe = JSON.parse(e);
    if (deepEqual(pa, pe)) return true;
  } catch {
    /* not JSON on one or both sides */
  }

  // Try numeric
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

/**
 * Wrap the student's code with a driver that:
 *  - injects the test case input as function arguments
 *  - invokes the student's function
 *  - prints the result (JSON-serialized)
 *
 * The student writes ONLY the function. No `__input__`, no `console.log`.
 */
function wrapForExecution(
  language: string,
  code: string,
  input: string,
  options: TestHarnessOptions
): string {
  // If outputMode is 'print', the student is responsible for printing.
  // We just prepend input and let their code run as-is.
  if (options.outputMode === 'print') {
    return wrapPrintMode(language, code, input);
  }

  // Return mode: auto-invoke the function with parsed args.
  return wrapReturnMode(language, code, input, options.functionName);
}

function parseArgs(input: string): { args: unknown[]; isArgsArray: boolean } {
  const trimmed = input.trim();
  if (trimmed === '') return { args: [], isArgsArray: false };

  try {
    const parsed = JSON.parse(trimmed);
    // If input is an array, treat its items as individual arguments.
    // e.g. `[2, 3]` → sum(2, 3). If input is a bare value, pass it as one arg.
    if (Array.isArray(parsed)) {
      return { args: parsed, isArgsArray: true };
    }
    return { args: [parsed], isArgsArray: false };
  } catch {
    // Non-JSON input → single string argument
    return { args: [trimmed], isArgsArray: false };
  }
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
print(__json__.dumps(__KODX_RESULT__))
`;
  }

  // Fallback: no wrapping
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
    return `const __input__ = ${args.length === 1 ? JSON.stringify(args[0]) : `[${argList}]`};
${code}
`;
  }

  if (language === 'python' || language === 'dsa-python') {
    if (args.length === 0) return code;
    const argList = args.map((a) => serialize(a, language)).join(', ');
    return `__input__ = ${args.length === 1 ? serialize(args[0], language) : `[${argList}]`}
${code}
`;
  }

  return code;
}
