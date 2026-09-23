/**
 * SHA-256 hashing for hidden-test output comparison.
 *
 * This module exists for tests and for future SQL/HTML hidden-test
 * support. The JavaScript and Python workers inline their own copies
 * of `sha256Hex` because they run in a classic/module-worker context
 * where importing from the workspace package is awkward.
 *
 * The digest produced here MUST match the digest produced by
 * `js.worker.ts` and `py.worker.ts` for the same input.
 */

export async function hashCanonical(canonical: string): Promise<string> {
  const data = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}