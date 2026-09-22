import { runJavaScriptHidden } from './jsRunner';
import { runPythonHidden } from './pythonRunner';
import type { CanonicalizationId } from '@kodxcamp/shared';

export type OutputMode = 'return' | 'print';

export interface HiddenTestCase {
  id: string;
  input: string;
  expectedOutputHash: string;
  canonicalization: CanonicalizationId;
}

export interface HiddenTestOutcome {
  id: string;
  passed: boolean;
}

export interface HiddenRunOptions {
  functionName?: string;
  outputMode?: OutputMode;
  timeoutMs?: number;
  onProgress?: (outcome: HiddenTestOutcome, index: number) => void;
}

export async function runHiddenTests(
  language: string,
  code: string,
  tests: HiddenTestCase[],
  options: HiddenRunOptions = {}
): Promise<HiddenTestOutcome[]> {
  const outcomes: HiddenTestOutcome[] = [];
  const timeoutMs = options.timeoutMs ?? 10000;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const outcome = await runOneHidden(language, code, test, {
      ...options,
      timeoutMs,
    });
    outcomes.push(outcome);
    options.onProgress?.(outcome, i);
  }

  return outcomes;
}

async function runOneHidden(
  language: string,
  code: string,
  test: HiddenTestCase,
  options: HiddenRunOptions
): Promise<HiddenTestOutcome> {
  const wrapped = wrapHiddenInput(language, code, test.input, options);

  if (
    language === 'javascript' ||
    language === 'typescript' ||
    language === 'dsa-javascript'
  ) {
    const result = await runJavaScriptHidden(
      wrapped,
      test.expectedOutputHash,
      test.canonicalization,
      { timeoutMs: options.timeoutMs ?? 10000 }
    );
    return { id: test.id, passed: result.passed };
  }

  if (language === 'python' || language === 'dsa-python') {
    const result = await runPythonHidden(
      wrapped,
      test.expectedOutputHash,
      test.canonicalization,
      { timeoutMs: options.timeoutMs ?? 10000 }
    );
    return { id: test.id, passed: result.passed };
  }

  return { id: test.id, passed: false };
}

function wrapHiddenInput(
  language: string,
  code: string,
  input: string,
  options: HiddenRunOptions
): string {
  const mode: OutputMode = options.outputMode ?? 'print';
  const isJs =
    language === 'javascript' ||
    language === 'typescript' ||
    language === 'dsa-javascript';
  const isPy = language === 'python' || language === 'dsa-python';

  if (!isJs && !isPy) return code;

  const { args } = parseArgs(input);

  if (mode === 'return') {
    const functionName = options.functionName ?? 'solve';

    if (isJs) {
      const argList = args.map((a) => JSON.stringify(a)).join(', ');
      return `${code}

// ── Hidden-test driver ────────────────────────────────
const __KODX_RESULT__ = ${functionName}(${argList});
console.log(JSON.stringify(__KODX_RESULT__));
`;
    }

    const argList = args.map((a) => pyLiteral(a)).join(', ');
    return `${code}

# ── Hidden-test driver ───────────────────────────────
import json as __json__
__KODX_RESULT__ = ${functionName}(${argList})
print(__json__.dumps(__KODX_RESULT__, separators=(',', ':')))
`;
  }

  if (args.length === 0) return code;

  if (isJs) {
    const argList = args.map((a) => JSON.stringify(a)).join(', ');
    return `const __input__ = ${
      args.length === 1 ? JSON.stringify(args[0]) : `[${argList}]`
    };
${code}
`;
  }

  const argList = args.map((a) => pyLiteral(a)).join(', ');
  return `__input__ = ${
    args.length === 1 ? pyLiteral(args[0]) : `[${argList}]`
  }
${code}
`;
}

function parseArgs(input: string): { args: unknown[] } {
  const trimmed = input.trim();
  if (trimmed === '') return { args: [] };

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return { args: parsed };
    return { args: [parsed] };
  } catch {
    /* fall through */
  }

  try {
    const parsed = JSON.parse(`[${trimmed}]`);
    if (Array.isArray(parsed)) return { args: parsed };
  } catch {
    /* fall through */
  }

  return { args: [trimmed] };
}

function pyLiteral(value: unknown): string {
  const json = JSON.stringify(value);
  return json
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None');
}