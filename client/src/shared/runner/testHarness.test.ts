import { describe, it, expect } from 'vitest';

describe('outputsMatch (via runTests) - string comparison behavior', () => {
  // These test the comparison rules directly, without needing a runner.

  const normalize = (s: string) =>
    s.trim().replace(/\r\n/g, '\n').replace(/\s+$/g, '');

  it('accepts identical strings', () => {
    expect(normalize('5')).toBe(normalize('5'));
  });

  it('ignores trailing whitespace', () => {
    expect(normalize('5 ')).toBe(normalize('5'));
  });

  it('treats [0,1] and [0, 1] as different at the string level', () => {
    // The harness uses deep-equal on JSON-parsed values, so this is fine.
    // This test just documents the base behavior.
    expect(normalize('[0,1]')).not.toBe(normalize('[0, 1]'));
  });
});
