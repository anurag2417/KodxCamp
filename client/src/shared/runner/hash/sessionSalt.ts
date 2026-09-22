/**
 * Per-session salt for hidden-test hashing.
 *
 * The salt is generated once when the client fetches a problem and is
 * reused for every hidden test in that session. It is never sent to the
 * server and never persisted — it exists only for the lifetime of the
 * problem session in memory.
 *
 * Purpose: prevents a shared `hash → expected output` lookup table from
 * being crowdsourced across students solving the same problem. Two
 * students hashing the same output get different digests.
 *
 * This is not a security boundary — a student who controls the browser
 * can read the salt and recompute hashes. It only raises the bar
 * against casual lookup attacks. See the project brief §4.3.1.
 */

const SALT_BYTES = 16;

/**
 * Generate a fresh random salt as a lowercase hex string.
 *
 * Uses `crypto.getRandomValues` (available in the browser and in
 * Workers). Not `crypto.subtle`, because we don't need a crypto-strength
 * RNG for a salt that only exists in memory.
 */
export function generateSessionSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive a stable hex digest from a salt and a canonicalized output.
 *
 * The salt is prefixed as raw UTF-8, then a NUL separator, then the
 * canonicalized output. The NUL prevents ambiguity when the salt has a
 * fixed length and the output could start with anything — without it,
 * "abc" + "def" and "abcd" + "ef" would collide.
 */
export async function hashWithSalt(
  salt: string,
  canonical: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}\x00${canonical}`);

  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}