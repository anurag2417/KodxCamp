import { getAdapter } from './adapters';
import type { CanonicalizationId } from '@kodxcamp/shared';
import type {
  HiddenTestCase,
  HiddenTestOutcome,
  HiddenRunOptions,
  OutputMode,
} from './hiddenHarness.types';

// Re-export so existing callers that import from './hiddenHarness'
// keep working without changes.
export type {
  HiddenTestCase,
  HiddenTestOutcome,
  HiddenRunOptions,
  OutputMode,
} from './hiddenHarness.types';

/**
 * Run every hidden test case against the student's code.
 *
 * The adapter for the language hashes the output inside its own
 * runtime boundary and returns only a boolean. Raw stdout never
 * crosses back.
 *
 * For languages whose runtime is not isolated (SQL, HTML), the
 * adapter returns `{ passed: false }` — fail closed.
 */
export async function runHiddenTests(
  language: string,
  code: string,
  tests: HiddenTestCase[],
  options: HiddenRunOptions = {}
): Promise<HiddenTestOutcome[]> {
  const adapter = getAdapter(language);
  const timeoutMs = options.timeoutMs ?? 15000;

  if (!adapter) {
    return tests.map((t) => ({ id: t.id, passed: false }));
  }

  const outcomes: HiddenTestOutcome[] = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const wrapped = wrapHiddenInput(language, code, test.input, options);

    const result = await adapter.runHidden(
      wrapped,
      test.input,
      test.expectedOutputHash,
      test.canonicalization as CanonicalizationId,
      { timeoutMs }
    );

    const outcome: HiddenTestOutcome = {
      id: test.id,
      passed: result.passed,
    };
    outcomes.push(outcome);
    options.onProgress?.(outcome, i);
  }

  return outcomes;
}

// ─── Wrapping ─────────────────────────────────────────────────────
//
// Mirrors `testHarness.ts`'s wrappers so a function that passes visible
// tests produces the same stdout for hidden tests. Keep the two files
// in sync if the wrapping rules change.

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
  const isRuby = language === 'ruby';

  if (!isJs && !isPy && !isRuby) return code;

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

    if (isPy) {
      const argList = args.map((a) => pyLiteral(a)).join(', ');
      return `${code}

# ── Hidden-test driver ───────────────────────────────
import json as __json__
__KODX_RESULT__ = ${functionName}(${argList})
print(__json__.dumps(__KODX_RESULT__, separators=(',', ':')))
`;
    }

    // Ruby
    const argList = args.map((a) => rubyLiteral(a)).join(', ');
    return `${code}

# ── Hidden-test driver ───────────────────────────────
require 'json'
__KODX_RESULT__ = ${functionName}(${argList})
puts __KODX_RESULT__.to_json
`;
  }

  // Print mode — inject __input__, let the student's code run and print.
  if (args.length === 0) return code;

  if (isJs) {
    const argList = args.map((a) => JSON.stringify(a)).join(', ');
    return `const __input__ = ${
      args.length === 1 ? JSON.stringify(args[0]) : `[${argList}]`
    };
${code}
`;
  }

  if (isPy) {
    const argList = args.map((a) => pyLiteral(a)).join(', ');
    return `__input__ = ${
      args.length === 1 ? pyLiteral(args[0]) : `[${argList}]`
    }
${code}
`;
  }

  // Ruby
  const argList = args.map((a) => rubyLiteral(a)).join(', ');
  return `__input__ = ${
    args.length === 1 ? rubyLiteral(args[0]) : `[${argList}]`
  }
${code}
`;
}

// ─── Argument parsing ─────────────────────────────────────────────

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