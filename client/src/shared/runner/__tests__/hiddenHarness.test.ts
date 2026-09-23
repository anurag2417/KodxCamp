import { describe, it, expect, expectTypeOf } from 'vitest';
import type { HiddenTestOutcome, HiddenTestCase } from '../hiddenHarness';

// ─── Type-level boundary ──────────────────────────────────────────
//
// This block fails to compile if someone adds an `output` field to
// `HiddenTestOutcome` (which would be a leak). It's a compile-time
// regression guard.

type HasOutputField = 'output' extends keyof HiddenTestOutcome ? true : false;
type HasStdoutField = 'stdout' extends keyof HiddenTestOutcome ? true : false;
type HasActualField = 'actualOutput' extends keyof HiddenTestOutcome ? true : false;

describe('HiddenTestOutcome — type-level boundary', () => {
  it('does not expose an output field', () => {
    expectTypeOf<HasOutputField>().toEqualTypeOf<false>();
    expectTypeOf<HasStdoutField>().toEqualTypeOf<false>();
    expectTypeOf<HasActualField>().toEqualTypeOf<false>();
  });

  it('exposes only id and passed', () => {
    expectTypeOf<keyof HiddenTestOutcome>().toEqualTypeOf<'id' | 'passed'>();
  });
});

// ─── Runtime boundary — SQL / HTML fail-closed path ───────────────
//
// The JS and Python paths construct a Worker, which jsdom doesn't
// implement. Those paths are exercised in the real browser (and would
// be exercised by Vitest's browser mode if we add it later). Here we
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
    // Assert no extra keys snuck in
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