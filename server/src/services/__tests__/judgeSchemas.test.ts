import { describe, it, expect } from 'vitest';
import { submitSchema } from '../../controllers/problem.controller.js';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

function wrap(body: unknown) {
  return { body, query: {}, params: {} };
}

describe('submitSchema — structured payload', () => {
  const validStructured = {
    problemId: 'p1',
    language: 'javascript',
    code: 'function solve() {}',
    sessionId: VALID_UUID,
    visibleResults: [
      { index: 0, passed: true },
      { index: 1, passed: false },
    ],
    hiddenResults: [{ id: 'p1:2', passed: true }],
    runtimeMs: 42,
  };

  it('accepts a valid structured payload', () => {
    const result = submitSchema.safeParse(wrap(validStructured));
    expect(result.success).toBe(true);
  });

  it('rejects a hidden result with an extra "output" key', () => {
    const payload = {
      ...validStructured,
      hiddenResults: [
        { id: 'p1:2', passed: true, output: 'leaked' },
      ],
    };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });

  it('rejects a hidden result with an extra "stdout" key', () => {
    const payload = {
      ...validStructured,
      hiddenResults: [{ id: 'p1:2', passed: true, stdout: 'leaked' }],
    };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });

  it('rejects a hidden result with an extra "expectedOutput" key', () => {
    const payload = {
      ...validStructured,
      hiddenResults: [
        { id: 'p1:2', passed: true, expectedOutput: '[0,1]' },
      ],
    };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });

  it('rejects an invalid sessionId (not a UUID)', () => {
    const payload = { ...validStructured, sessionId: 'not-a-uuid' };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });

  it('rejects an extra top-level key', () => {
    const payload = { ...validStructured, sneaky: true };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });

  it('rejects a visible result with a non-boolean passed', () => {
    const payload = {
      ...validStructured,
      visibleResults: [{ index: 0, passed: 'yes' }],
    };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });
});

describe('submitSchema — legacy payload', () => {
  const validLegacy = {
    problemId: 'p1',
    language: 'javascript',
    code: 'function solve() {}',
    status: 'wrong_answer',
    passedTests: 3,
    totalTests: 5,
    runtimeMs: 42,
  };

  it('accepts a valid legacy payload', () => {
    const result = submitSchema.safeParse(wrap(validLegacy));
    expect(result.success).toBe(true);
  });

  it('rejects a legacy payload with an extra hiddenResults key', () => {
    const payload = {
      ...validLegacy,
      hiddenResults: [{ id: 'p1:2', passed: true }],
    };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const payload = { ...validLegacy, status: 'maybe' };
    const result = submitSchema.safeParse(wrap(payload));
    expect(result.success).toBe(false);
  });
});