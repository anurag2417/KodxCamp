import { describe, it, expect } from 'vitest';
import { hashCanonical } from '../hash/hashOutput';

describe('hashCanonical — SHA-256 fixtures', () => {
  it('hashes the empty string to the canonical SHA-256 digest', async () => {
    expect(await hashCanonical('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('hashes "abc" to the canonical SHA-256 digest', async () => {
    expect(await hashCanonical('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('hashes "[0,1]" and produces a 64-char hex digest', async () => {
    const digest = await hashCanonical('[0,1]');
    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different digests for whitespace-distinct inputs', async () => {
    const a = await hashCanonical('[0,1]');
    const b = await hashCanonical('[0, 1]');
    expect(a).not.toBe(b);
  });

  it('produces the same digest for identical inputs (determinism)', async () => {
    const a = await hashCanonical('stable input');
    const b = await hashCanonical('stable input');
    expect(a).toBe(b);
  });

  it('matches Node crypto for the same canonicalized bytes', async () => {
    const input = '[2,3]';
    const clientDigest = await hashCanonical(input);
    const { createHash } = await import('node:crypto');
    const nodeDigest = createHash('sha256').update(input).digest('hex');
    expect(clientDigest).toBe(nodeDigest);
  });
});