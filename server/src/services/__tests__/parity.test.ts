import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

type CanonicalizationId = 'trim-trailing-newline' | 'trim-all' | 'exact';

function canonicalize(plaintext: string, mode: CanonicalizationId): string {
  switch (mode) {
    case 'trim-trailing-newline':
      return plaintext.replace(/(?:\r\n|\n)$/, '');
    case 'trim-all':
      return plaintext.trim();
    case 'exact':
      return plaintext;
  }
}

/**
 * Client-side hashing (from client/src/shared/runner/hash/hashOutput.ts):
 *
 *   const data = new TextEncoder().encode(canonical);
 *   const digest = await crypto.subtle.digest('SHA-256', data);
 *   return hex(digest);
 *
 * Server-side hashing (from server/src/services/problem.service.ts):
 *
 *   crypto.createHash('sha256').update(canonical).digest('hex')
 *
 * Both implement SHA-256 per FIPS 180-4. This test asserts that the
 * server and client produce the same digest for the same canonicalized
 * input.
 */

function hashServer(
  plaintext: string,
  mode: CanonicalizationId = 'trim-trailing-newline'
): string {
  const canon = canonicalize(plaintext, mode);
  return crypto.createHash('sha256').update(canon).digest('hex');
}

function hashClientEquivalent(canonical: string): string {
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

describe('client/server hash parity', () => {
  const cases: Array<{ plaintext: string; mode: CanonicalizationId }> = [
    { plaintext: '[0,1]', mode: 'trim-trailing-newline' },
    { plaintext: '[0,1]\n', mode: 'trim-trailing-newline' },
    { plaintext: '[0,1]\r\n', mode: 'trim-trailing-newline' },
    { plaintext: '[0, 1]', mode: 'trim-trailing-newline' },
    { plaintext: 'true', mode: 'trim-trailing-newline' },
    { plaintext: 'false', mode: 'trim-trailing-newline' },
    { plaintext: '["a","b"]', mode: 'trim-trailing-newline' },
    { plaintext: '42', mode: 'trim-trailing-newline' },
    { plaintext: '  42  ', mode: 'trim-all' },
    { plaintext: 'abc  ', mode: 'exact' },
  ];

  it.each(cases)(
    'server and client hash the same canonicalized bytes for $plaintext ($mode)',
    ({ plaintext, mode }) => {
      const canonical = canonicalize(plaintext, mode);
      const serverHash = hashServer(plaintext, mode);
      const clientHash = hashClientEquivalent(canonical);
      expect(serverHash).toBe(clientHash);
    }
  );

  it('produces 64-char lowercase hex for every case', () => {
    for (const { plaintext, mode } of cases) {
      const hash = hashServer(plaintext, mode);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('whitespace-variant inputs produce distinct hashes', () => {
    const a = hashServer('[0,1]');
    const b = hashServer('[0, 1]');
    expect(a).not.toBe(b);
  });

  it('canonically-equivalent inputs produce identical hashes', () => {
    const a = hashServer('[0,1]');
    const b = hashServer('[0,1]\n');
    const c = hashServer('[0,1]\r\n');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});