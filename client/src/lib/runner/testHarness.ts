import { runCode, type RunResult } from './index';

export interface TestCase {
  index: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface TestResult {
  index: number;
  passed: boolean;
  isHidden: boolean;
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
 * For languages where each test case needs a *fresh run* of the program,
 * we wrap the student's code with an input-injection preamble.
 * For now, this is only used for JavaScript/Python where inputs are expressions.
 *
 * In our current lesson set, most tests pass inputs as "no input + check stdout",
 * so we just execute the code once per test with a small preamble.
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

    const passed = result.ok && normalize(result.stdout) === normalize(tc.expectedOutput);

    results.push({
      index: tc.index,
      passed,
      isHidden: tc.isHidden,
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
 * Inject test case input into code as a variable or stdin substitute.
 * JS: prepend `const __input__ = <input>;` — the student code can read it.
 * Python: prepend `__input__ = <input>`.
 */
function wrapWithInput(language: string, code: string, input: string): string {
  if (!input || input.trim() === '') return code;

  if (language === 'javascript' || language === 'typescript' || language === 'dsa-javascript') {
    return `const __input__ = ${input};\n${code}\n`;
  }
  if (language === 'python' || language === 'dsa-python') {
    return `__input__ = ${input}\n${code}\n`;
  }
  // SQL and HTML don't take input this way
  return code;
}