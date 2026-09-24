import { describe, it, expect } from 'vitest';
import { submitSchema } from '../../controllers/problem.controller.js';

function wrap(body: unknown) {
  return { body, query: {}, params: {} };
}

describe('submitSchema - legacy payload', () => {
  const valid = {
    problemId: 'p1',
    language: 'javascript',
    code: 'function solve() {}',
    status: 'wrong_answer',
    passedTests: 3,
    totalTests: 5,
    runtimeMs: 42,
  };

  it('accepts a valid payload', () => {
    const result = submitSchema.safeParse(wrap(valid));
    expect(result.success).toBe(true);
  });

  it('accepts an accepted status', () => {
    const result = submitSchema.safeParse(
      wrap({ ...valid, status: 'accepted', passedTests: 5 })
    );
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status', () => {
    const result = submitSchema.safeParse(wrap({ ...valid, status: 'maybe' }));
    expect(result.success).toBe(false);
  });

  it('rejects a missing problemId', () => {
    const { problemId, ...rest } = valid;
    void problemId;
    const result = submitSchema.safeParse(wrap(rest));
    expect(result.success).toBe(false);
  });

  it('rejects an extra top-level key', () => {
    const result = submitSchema.safeParse(wrap({ ...valid, sneaky: true }));
    expect(result.success).toBe(false);
  });

  it('rejects a hiddenResults key (no longer part of the schema)', () => {
    const result = submitSchema.safeParse(
      wrap({ ...valid, hiddenResults: [{ id: 'x', passed: true }] })
    );
    expect(result.success).toBe(false);
  });

  it('rejects a sessionId key', () => {
    const result = submitSchema.safeParse(
      wrap({ ...valid, sessionId: 'abc' })
    );
    expect(result.success).toBe(false);
  });

  it('rejects a negative passedTests', () => {
    const result = submitSchema.safeParse(wrap({ ...valid, passedTests: -1 }));
    expect(result.success).toBe(false);
  });
});