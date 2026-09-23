import { runCode, type RunResult } from '@/shared/runner/index';

export type OutputMode = 'return' | 'print';

// ─── Visible-test types ───────────────────────────────────────────

export interface VisibleTestCase {
  index: number;
  input: string;
  expectedOutput: string;
  /** Display flag. Hides the input/output from the student's panel. */
  isHidden?: boolean;
}

export interface VisibleTestResult {
  index: number;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  stderr?: string;
  runtimeMs: number;
  /** Display flag. When true, the UI elides input/output details. */
  isHidden?: boolean;
}

// ─── Summary ──────────────────────────────────────────────────────

export interface TestRunSummary {
  results: VisibleTestResult[];
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

/**
 * Run every test case sequentially against the student's code.
 *
 * The `isHidden` flag on a test case is a display concern only — it
 * does not affect execution. Hidden tests still run and their
 * pass/fail still counts toward the final verdict. The UI decides
 * whether to reveal the input/output to the student.
 */
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
      timeoutMs: 30000,
    });

    totalRuntimeMs += result.runtimeMs;

    const actual = result.stdout;
    const passed =
      result.ok && outputsMatch(actual, tc.expectedOutput, options.outputMode);

    results.push({
      index: tc.index,
      passed,
      actualOutput: actual,
      expectedOutput: tc.expectedOutput,
      stderr: result.stderr,
      runtimeMs: result.runtimeMs,
      isHidden: tc.isHidden,
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

// ─── Output comparison ────────────────────────────────────────────

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

// ─── Wrapping ─────────────────────────────────────────────────────

function wrapForExecution(
  language: string,
  code: string,
  input: string,
  options: TestHarnessOptions
): string {
  // Java problems must use print mode — CheerpJ runs a main method,
  // not a function. Return mode isn't supported for Java.
  if (language === 'java' && options.outputMode === 'return') {
    return `// ERROR: Java problems must use outputMode: 'print'.
// Write a public class Main with a static main(String[] args)
// method that prints the answer to stdout using System.out.println.
public class Main {
  public static void main(String[] args) {
    System.err.println(
      "KodxCamp: Java problems must use outputMode: 'print'."
    );
  }
}
`;
  }

  if (options.outputMode === 'print') {
    return wrapPrintMode(language, code, input);
  }
  return wrapReturnMode(language, code, input, options.functionName);
}

/**
 * Parse a test case's `input` string into a list of arguments.
 *
 * Handles three shapes:
 *   1. Valid JSON array → items become individual arguments.
 *   2. Comma-separated values that aren't a single JSON value.
 *   3. Anything else → single string argument.
 */
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

// ─── Literal serializers ──────────────────────────────────────────

function serialize(value: unknown, language: string): string {
  if (language === 'python' || language === 'dsa-python') {
    return pyLiteral(value);
  }
  if (language === 'ruby') {
    return rubyLiteral(value);
  }
  if (language === 'java') {
    return javaLiteral(value);
  }
  return JSON.stringify(value);
}

function pyLiteral(value: unknown): string {
  const json = JSON.stringify(value);
  return json
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None');
}

function rubyLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'nil';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => rubyLiteral(v)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const pairs = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${JSON.stringify(k)} => ${rubyLiteral(v)}`)
      .join(', ');
    return `{${pairs}}`;
  }
  return JSON.stringify(value);
}

function javaLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return `${value}`;
  }
  if (typeof value === 'string') {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }
  if (Array.isArray(value)) {
    return `new Object[]{${value.map((v) => javaLiteral(v)).join(', ')}}`;
  }
  return 'null';
}

// ─── Return mode ──────────────────────────────────────────────────

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
    const argList = args.map((a) => pyLiteral(a)).join(', ');
    return `${code}

# ── Auto-generated driver ───────────────────────────────
import json as __json__
__KODX_RESULT__ = ${functionName}(${argList})
print(__json__.dumps(__KODX_RESULT__, separators=(',', ':')))
`;
  }

  if (language === 'ruby') {
    const argList = args.map((a) => rubyLiteral(a)).join(', ');
    return `${code}

# ── Auto-generated driver ───────────────────────────────
require 'json'
__KODX_RESULT__ = ${functionName}(${argList})
puts __KODX_RESULT__.to_json
`;
  }

  if (language === 'java') {
    return `${code}

// Java return mode is not supported. Use outputMode: 'print'.
`;
  }

  return code;
}

// ─── Print mode ───────────────────────────────────────────────────

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
    const argList = args.map((a) => pyLiteral(a)).join(', ');
    return `__input__ = ${
      args.length === 1 ? pyLiteral(args[0]) : `[${argList}]`
    }
${code}
`;
  }

  if (language === 'ruby') {
    if (args.length === 0) return code;
    const argList = args.map((a) => rubyLiteral(a)).join(', ');
    return `__input__ = ${
      args.length === 1 ? rubyLiteral(args[0]) : `[${argList}]`
    }
${code}
`;
  }

  if (language === 'java') {
    const argsLiteral =
      args.length === 0
        ? 'new Object[]{}'
        : args.length === 1
          ? `new Object[]{${javaLiteral(args[0])}}`
          : `new Object[]{${args.map((a) => javaLiteral(a)).join(', ')}}`;

    return `${code}

// ── Auto-generated input binding ─────────────────────────
// The test input is available as KodxInput.args (Object[]).
class KodxInput {
  public static final Object[] args = ${argsLiteral};
}
`;
  }

  return code;
}