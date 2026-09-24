import { runCode, type RunResult } from '@/shared/runner/index';
import { runJavaBatch } from '@/shared/runner/javaRuntime';
import {
  runSqlSetup,
  runSql,
  type SqlDatabase,
} from '@/shared/runner/sqlRunner';

export type OutputMode = 'return' | 'print';

// ─── Test types ───────────────────────────────────────────────────

export interface VisibleTestCase {
  index: number;
  input: string;
  expectedOutput: string;
  /** Display flag. Hides input/output from the student's test panel. */
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

export interface TestRunSummary {
  results: VisibleTestResult[];
  passedTests: number;
  totalTests: number;
  allPassed: boolean;
  totalRuntimeMs: number;
}

export interface TestHarnessOptions {
  /** Name of the function the student implements (or `main` for Java). */
  functionName: string;
  /** Whether to compare the function's return value, or stdout. */
  outputMode: OutputMode;
  /** SQL-only: schema + seed SQL executed once before any test case. */
  sqlSetup?: string;
}

export async function runTests(
  language: string,
  code: string,
  testCases: VisibleTestCase[],
  options: TestHarnessOptions
): Promise<TestRunSummary> {
  // ─── SQL ──────────────────────────────────────────────────────
  // For SQL we don't wrap per-test: the setup runs once, the student's
  // query runs against the seeded DB, and the formatted result table
  // is compared to each test case's expectedOutput.
  if (language === 'sql') {
    return runSqlTests(code, testCases, options);
  }

  // ─── Java ─────────────────────────────────────────────────────
  // Compile once, run one entry point per test case.
  if (language === 'java' && testCases.length > 0) {
    const wrappedCases = testCases.map((tc, index) => {
      const wrapped = wrapForExecution(language, code, tc.input, options);
      const driver = wrapped.slice(code.length).replace(
        'class KodxEntry {',
        `class KodxEntry${index} {`
      );
      return `${driver}\n`;
    });
    const results = await runJavaBatch(
      `${code}\n${wrappedCases.join('')}`,
      testCases.map((_, index) => `KodxEntry${index}`)
    );

    const visibleResults = testCases.map((tc, index) => {
      const result = results[index];
      const actual = result.stdout;
      return {
        index: tc.index,
        passed:
          result.ok && outputsMatch(actual, tc.expectedOutput, options.outputMode),
        actualOutput: actual,
        expectedOutput: tc.expectedOutput,
        stderr: result.stderr,
        runtimeMs: result.runtimeMs,
        isHidden: tc.isHidden,
      };
    });

    return {
      results: visibleResults,
      passedTests: visibleResults.filter((r) => r.passed).length,
      totalTests: visibleResults.length,
      allPassed: visibleResults.every((r) => r.passed),
      totalRuntimeMs: visibleResults.reduce((sum, r) => sum + r.runtimeMs, 0),
    };
  }

  // ─── Everything else ──────────────────────────────────────────
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

// ─── SQL driver ───────────────────────────────────────────────────

async function runSqlTests(
  studentQuery: string,
  testCases: VisibleTestCase[],
  options: TestHarnessOptions
): Promise<TestRunSummary> {
  // Seed the DB once. `setup.db` is the live handle the student's
  // query will run against - the same database, not a fresh one.
  const setup = await runSqlSetup(options.sqlSetup);

  if (!setup.result.ok || !setup.db) {
    const results: VisibleTestResult[] = testCases.map((tc) => ({
      index: tc.index,
      passed: false,
      actualOutput: '',
      expectedOutput: tc.expectedOutput,
      stderr: setup.result.stderr || 'SQL setup failed',
      runtimeMs: setup.result.runtimeMs,
      isHidden: tc.isHidden,
    }));
    return {
      results,
      passedTests: 0,
      totalTests: results.length,
      allPassed: false,
      totalRuntimeMs: setup.result.runtimeMs,
    };
  }

  const db: SqlDatabase = setup.db;

  let runResult: RunResult;
  try {
    runResult = await runSql(studentQuery, { timeoutMs: 30000 }, db);
  } finally {
    // We own the handle now - close it whether or not the run succeeded.
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }

  const actual = runResult.stdout.trim();

  const results: VisibleTestResult[] = testCases.map((tc) => {
    const passed =
      runResult.ok && outputsMatch(actual, tc.expectedOutput, options.outputMode);
    return {
      index: tc.index,
      passed,
      actualOutput: actual,
      expectedOutput: tc.expectedOutput,
      stderr: runResult.stderr,
      runtimeMs: runResult.runtimeMs,
      isHidden: tc.isHidden,
    };
  });

  return {
    results,
    passedTests: results.filter((r) => r.passed).length,
    totalTests: results.length,
    allPassed: results.every((r) => r.passed),
    totalRuntimeMs: runResult.runtimeMs,
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

// ─── Literal serializers ──────────────────────────────────────────

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
    return Number.isInteger(value) ? String(value) : String(value);
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
    const first = value.find((v) => v !== null && v !== undefined);
    if (typeof first === 'number' && Number.isInteger(first)) {
      return `new int[]{${value.map((v) => javaLiteral(v)).join(', ')}}`;
    }
    if (typeof first === 'number') {
      return `new double[]{${value.map((v) => javaLiteral(v)).join(', ')}}`;
    }
    if (typeof first === 'boolean') {
      return `new boolean[]{${value.map((v) => javaLiteral(v)).join(', ')}}`;
    }
    if (typeof first === 'string') {
      return `new String[]{${value.map((v) => javaLiteral(v)).join(', ')}}`;
    }
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

  // Java - reflective driver. Output is wrapped in markers so the
  // runtime can distinguish it from CheerpJ's own console noise.
  if (language === 'java') {
    const argList = args.map((a) => javaLiteral(a)).join(', ');
    return `${code}

// ── Auto-generated driver ────────────────────────────────
class KodxEntry {
  public static void main(String[] args) throws Exception {
    Object result = Main.${functionName}(${argList});
    System.out.println("<<<KODX_OUTPUT>>>");
    System.out.println(__toJson__(result));
    System.out.println("<<<KODX_END>>>");
  }

  static String __toJson__(Object o) {
    if (o == null) return "null";
    if (o instanceof String) return "\\"" + __escape__((String) o) + "\\"";
    if (o instanceof Character) return "\\"" + __escape__(o.toString()) + "\\"";
    if (o instanceof Number || o instanceof Boolean) return o.toString();
    if (o instanceof int[]) {
      int[] a = (int[]) o;
      StringBuilder sb = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }
      return sb.append("]").toString();
    }
    if (o instanceof long[]) {
      long[] a = (long[]) o;
      StringBuilder sb = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }
      return sb.append("]").toString();
    }
    if (o instanceof double[]) {
      double[] a = (double[]) o;
      StringBuilder sb = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }
      return sb.append("]").toString();
    }
    if (o instanceof boolean[]) {
      boolean[] a = (boolean[]) o;
      StringBuilder sb = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }
      return sb.append("]").toString();
    }
    if (o instanceof Object[]) {
      Object[] a = (Object[]) o;
      StringBuilder sb = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(__toJson__(a[i])); }
      return sb.append("]").toString();
    }
    if (o instanceof Iterable) {
      StringBuilder sb = new StringBuilder("[");
      boolean first = true;
      for (Object item : (Iterable<?>) o) {
        if (!first) sb.append(",");
        sb.append(__toJson__(item));
        first = false;
      }
      return sb.append("]").toString();
    }
    return "\\"" + __escape__(o.toString()) + "\\"";
  }

  static String __escape__(String s) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      switch (c) {
        case '"': sb.append("\\\\\\""); break;
        case '\\\\': sb.append("\\\\\\\\"); break;
        case '\\n': sb.append("\\\\n"); break;
        case '\\r': sb.append("\\\\r"); break;
        case '\\t': sb.append("\\\\t"); break;
        default: sb.append(c);
      }
    }
    return sb.toString();
  }
}
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

  // Java - delegate to Main.main, wrapping its stdout in markers so the
  // runtime can separate the student's output from CheerpJ's own logs.
  if (language === 'java') {
    const argsLiteral =
      args.length === 0
        ? 'new String[]{}'
        : `new String[]{${args
            .map((a) =>
              typeof a === 'string'
                ? javaLiteral(a)
                : javaLiteral(String(a))
            )
            .join(', ')}}`;

    return `${code}

// ── Auto-generated entry point ──────────────────────────
class KodxEntry {
  public static void main(String[] args) throws Exception {
    System.out.println("<<<KODX_OUTPUT>>>");
    try {
      Main.main(args);
    } finally {
      System.out.println("<<<KODX_END>>>");
    }
  }

  // The test input, available if the student's code wants it.
  public static final String[] __input__ = ${argsLiteral};
}
`;
  }

  // SQL: the student's query is the code; the setup is handled
  // separately in runSqlTests. Return code unchanged.
  return code;
}