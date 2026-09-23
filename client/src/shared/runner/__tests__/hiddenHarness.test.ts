import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  HiddenTestOutcome,
  HiddenTestCase,
} from '../hiddenHarness.types';

// ─── Type-level boundary ──────────────────────────────────────────
//
// Compile-time regression guards. If someone adds an `output` field
// (or any other output-shaped field) to `HiddenTestOutcome`, these
// assertions fail to compile and the test file won't build.

describe('HiddenTestOutcome — type-level boundary', () => {
  it('has exactly two keys: id and passed', () => {
    expectTypeOf<keyof HiddenTestOutcome>().toEqualTypeOf<'id' | 'passed'>();
  });

  it('does not expose an "output" field', () => {
    type HasOutput = 'output' extends keyof HiddenTestOutcome ? true : false;
    expectTypeOf<HasOutput>().toEqualTypeOf<false>();
  });

  it('does not expose a "stdout" field', () => {
    type HasStdout = 'stdout' extends keyof HiddenTestOutcome ? true : false;
    expectTypeOf<HasStdout>().toEqualTypeOf<false>();
  });

  it('does not expose an "actualOutput" field', () => {
    type HasActual =
      'actualOutput' extends keyof HiddenTestOutcome ? true : false;
    expectTypeOf<HasActual>().toEqualTypeOf<false>();
  });

  it('does not expose an "expectedOutput" field', () => {
    type HasExpected =
      'expectedOutput' extends keyof HiddenTestOutcome ? true : false;
    expectTypeOf<HasExpected>().toEqualTypeOf<false>();
  });

  it('id is a string and passed is a boolean', () => {
    expectTypeOf<HiddenTestOutcome['id']>().toEqualTypeOf<string>();
    expectTypeOf<HiddenTestOutcome['passed']>().toEqualTypeOf<boolean>();
  });
});

// ─── Runtime boundary — SQL / HTML fail-closed path ───────────────
//
// The JS and Python paths construct a Worker, which jsdom doesn't
// implement. Those paths are exercised in the real browser. Here we
// only test the SQL/HTML fail-closed branch, which runs synchronously
// on the main thread and is safe to unit test in Node.

describe('runHiddenTests — SQL/HTML fail-closed', () => {
  it('marks SQL hidden tests as failed', async () => {
    const { runHiddenTests } = await import('../hiddenHarness');

    const tests: HiddenTestCase[] = [
      {
        id: 'sql:0',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
    ];

    const outcomes = await runHiddenTests('sql', 'SELECT 1', tests, {
      timeoutMs: 50,
    });

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({ id: 'sql:0', passed: false });
    expect(Object.keys(outcomes[0]).sort()).toEqual(['id', 'passed']);
  });

  it('marks HTML hidden tests as failed', async () => {
    const { runHiddenTests } = await import('../hiddenHarness');

    const tests: HiddenTestCase[] = [
      {
        id: 'html:0',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
    ];

    const outcomes = await runHiddenTests(
      'html-css',
      '<h1>hi</h1>',
      tests,
      { timeoutMs: 50 }
    );

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({ id: 'html:0', passed: false });
  });

  it('marks tailwind hidden tests as failed', async () => {
    const { runHiddenTests } = await import('../hiddenHarness');

    const tests: HiddenTestCase[] = [
      {
        id: 'tw:0',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
    ];

    const outcomes = await runHiddenTests(
      'tailwind',
      '<div class="p-4">hi</div>',
      tests,
      { timeoutMs: 50 }
    );

    expect(outcomes[0]).toEqual({ id: 'tw:0', passed: false });
  });

  it('returns one outcome per test, in order', async () => {
    const { runHiddenTests } = await import('../hiddenHarness');

    const tests: HiddenTestCase[] = [
      {
        id: 'sql:a',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
      {
        id: 'sql:b',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
    ];

    const outcomes = await runHiddenTests('sql', '', tests, { timeoutMs: 50 });
    expect(outcomes.map((o) => o.id)).toEqual(['sql:a', 'sql:b']);
  });

  it('invokes onProgress for each test', async () => {
    const { runHiddenTests } = await import('../hiddenHarness');

    const tests: HiddenTestCase[] = [
      {
        id: 'sql:1',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
      {
        id: 'sql:2',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
    ];

    const calls: Array<{ id: string; passed: boolean; index: number }> = [];

    await runHiddenTests('sql', '', tests, {
      timeoutMs: 50,
      onProgress: (outcome, index) => {
        calls.push({ id: outcome.id, passed: outcome.passed, index });
      },
    });

    expect(calls).toEqual([
      { id: 'sql:1', passed: false, index: 0 },
      { id: 'sql:2', passed: false, index: 1 },
    ]);
  });
});

// ─── Unknown-language fallback ────────────────────────────────────
//
// If the registry doesn't have an adapter for a language, runHiddenTests
// returns all-failed outcomes rather than throwing. This is a defensive
// behavior — a problem configured with a language the client doesn't
// support should fail closed, not crash the page.

describe('runHiddenTests — unknown language', () => {
  it('returns { passed: false } for every test when no adapter exists', async () => {
    const { runHiddenTests } = await import('../hiddenHarness');

    const tests: HiddenTestCase[] = [
      {
        id: 'x:0',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
      {
        id: 'x:1',
        input: '',
        expectedOutputHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        canonicalization: 'trim-trailing-newline',
      },
    ];

    const outcomes = await runHiddenTests('cobol', '', tests, {
      timeoutMs: 50,
    });

    expect(outcomes).toEqual([
      { id: 'x:0', passed: false },
      { id: 'x:1', passed: false },
    ]);
  });
});