import { runCode, type RunResult } from './index';

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

/**
 * Runs all test cases for a submission.
 *
 * Input handling:
 *  - If `tc.input` is empty → code runs as-is.
 *  - If `tc.input` is valid JSON → it is injected as the parsed value
 *    (numbers, strings, arrays, objects all supported).
 *  - If `tc.input` is NOT valid JSON → it is injected as a **string literal**.
 *    This makes "hello world" work as a string input even if the admin
 *    forgot to add quotes.
 */
export async function runTests(
  language: string,
  code: string,
  testCases: TestCase[]
): Promise<TestRunSummary> {
  const results: TestResult[] = [];
  let totalRuntimeMs = 0;

  for (const tc of testCases) {
    const wrappedCode = wrapWithInput(language, code, tc.input);
    const result: RunResult = await runCode(language, wrappedCode, {
      timeoutMs: 5000,
    });

    totalRuntimeMs += result.runtimeMs;

    const passed =
      result.ok && normalize(result.stdout) === normalize(tc.expectedOutput);

    results.push({
      index: tc.index,
      passed,
      actualOutput: result.stdout,
      stderr: result.stderr,
      runtimeMs: result.runtimeMs,
    });
  }

  const passedTests = results.filter((r) => r.passed).length;
  const allPassed = passedTests === testCases.length;

  return {
    results,
    passedTests,
    totalTests: testCases.length,
    allPassed,
    totalRuntimeMs,
  };
}

function normalize(s: string): string {
  return s.trim().replace(/\r\n/g, '\n').replace(/\s+$/g, '');
}

/**
 * Parse an input string into a proper value.
 *
 * Tries JSON first. If that fails, treats the whole thing as a raw string.
 * This is forgiving: `[2,3]` → array, `2` → number, `"hi"` → string,
 * `hello` → string "hello" (not a syntax error).
 */
function parseInput(raw: string): { value: unknown; isJson: boolean } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: undefined, isJson: false };

  try {
    return { value: JSON.parse(trimmed), isJson: true };
  } catch {
    return { value: trimmed, isJson: false };
  }
}

/**
 * Serialize a parsed value into a literal expression for the target language.
 */
function serializeFor(language: string, value: unknown): string {
  const isPython = language === 'python' || language === 'dsa-python';
  const json = JSON.stringify(value);

  if (isPython) {
    // JSON is mostly compatible with Python literals for our supported types:
    // numbers, strings, booleans, null → None, arrays → lists, objects → dicts.
    return json
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/\bnull\b/g, 'None');
  }
  return json; // JS accepts JSON as-is
}

/**
 * Inject test case input into code.
 *
 * JS:     `const __input__ = <value>;` prepended
 * Python: `__input__ = <value>` prepended
 *
 * The student's code can read `__input__`. If the value is an array, the
 * student can destructure it: `const [a, b] = __input__;` / `a, b = __input__`.
 */
function wrapWithInput(language: string, code: string, input: string): string {
  const { value, isJson } = parseInput(input);

  // Empty input → run code as-is
  if (!input || input.trim() === '') return code;

  // Not-JSON input that isn't a valid literal → treat as a string.
  // But if the user typed something that IS valid JSON, we already have it.
  // If they typed `hello` (no quotes), we wrap it as `"hello"`.
  let serialized: string;
  if (isJson) {
    serialized = serializeFor(language, value);
  } else {
    // Non-JSON: treat as a plain string
    serialized = serializeFor(language, String(value));
  }

  if (language === 'javascript' || language === 'typescript' || language === 'dsa-javascript') {
    return `const __input__ = ${serialized};\n${code}\n`;
  }
  if (language === 'python' || language === 'dsa-python') {
    return `__input__ = ${serialized}\n${code}\n`;
  }
  // SQL / HTML don't take input this way
  return code;
}