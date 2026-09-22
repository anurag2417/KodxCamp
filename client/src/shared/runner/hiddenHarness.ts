import { runJavaScriptHidden } from './jsRunner';
import { runPythonHidden } from './pythonRunner';
import type { CanonicalizationId } from '@kodxcamp/shared';

/**
 * A single hidden test case, as delivered by the server.
 *
 * The server does NOT send the plaintext expected output — only its
 * SHA-256 hash. See the project brief §4.3.1.
 */
export interface HiddenTestCase {
  /** Stable id, `${problemId}:${index}` on the server. */
  id: string;
  input: string;
  /** 64-char lowercase hex. SHA-256 of the canonicalized expected output. */
  expectedOutputHash: string;
  canonicalization: CanonicalizationId;
}

export interface HiddenTestOutcome {
  id: string;
  passed: boolean;
}

export interface HiddenRunOptions {
  timeoutMs?: number;
  onProgress?: (outcome: HiddenTestOutcome, index: number) => void;
}

/**
 * Run every hidden test case against the student's code.
 *
 * For JavaScript and Python, the wrapping + hashing happens inside the
 * Worker. The main thread only sees `{ passed }` per test.
 *
 * For SQL and HTML the visible runner path is synchronous on the main
 * thread, so hidden tests for those languages fall back to main-thread
 * hashing. This is a documented limitation — see §4.3.1.
 */
export async function runHiddenTests(
  language: string,
  code: string,
  tests: HiddenTestCase[],
  options: HiddenRunOptions = {}
): Promise<HiddenTestOutcome[]> {
  const outcomes: HiddenTestOutcome[] = [];
  const timeoutMs = options.timeoutMs ?? 5000;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const outcome = await runOneHidden(language, code, test, timeoutMs);
    outcomes.push(outcome);
    options.onProgress?.(outcome, i);
  }

  return outcomes;
}

async function runOneHidden(
  language: string,
  code: string,
  test: HiddenTestCase,
  timeoutMs: number
): Promise<HiddenTestOutcome> {
  const wrapped = wrapHiddenInput(language, code, test.input);

  if (
    language === 'javascript' ||
    language === 'typescript' ||
    language === 'dsa-javascript'
  ) {
    const result = await runJavaScriptHidden(
      wrapped,
      test.expectedOutputHash,
      test.canonicalization,
      { timeoutMs }
    );
    return { id: test.id, passed: result.passed };
  }

  if (language === 'python' || language === 'dsa-python') {
    const result = await runPythonHidden(
      wrapped,
      test.expectedOutputHash,
      test.canonicalization,
      { timeoutMs }
    );
    return { id: test.id, passed: result.passed };
  }

  // SQL / HTML / React — no worker-level hashing today. Fail closed:
  // mark the test as not passed rather than leaking the output. Once
  // we have worker-wrapped runners for these languages, replace this
  // with the same pattern used above.
  return { id: test.id, passed: false };
}

function wrapHiddenInput(
  language: string,
  code: string,
  input: string
): string {
  const isJs =
    language === 'javascript' ||
    language === 'typescript' ||
    language === 'dsa-javascript';
  const isPy = language === 'python' || language === 'dsa-python';

  if (!isJs && !isPy) return code;

  const { args } = parseArgs(input);

  if (isJs) {
    const argList = args.map((a) => JSON.stringify(a)).join(', ');
    const inputLine = argList
      ? `const __input__ = ${args.length === 1 ? JSON.stringify(args[0]) : `[${argList}]`};\n`
      : '';
    return `${inputLine}${code}`;
  }

  const argList = args.map((a) => pyLiteral(a)).join(', ');
  const inputLine = argList
    ? `__input__ = ${args.length === 1 ? pyLiteral(args[0]) : `[${argList}]`}\n`
    : '';
  return `${inputLine}${code}`;
}

function parseArgs(input: string): { args: unknown[] } {
  const trimmed = input.trim();
  if (trimmed === '') return { args: [] };
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return { args: parsed };
    return { args: [parsed] };
  } catch {
    return { args: [trimmed] };
  }
}

function pyLiteral(value: unknown): string {
  const json = JSON.stringify(value);
  return json
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None');
}