import type { CanonicalizationId } from '../types/problem';

/**
 * Canonicalize an output string before hashing.
 *
 * Client and server MUST apply the same rule for a given
 * `canonicalization` id, or every hidden test will fail. This module
 * lives in `shared/` so both packages import the same code.
 *
 * Rules (pick one per test case and freeze it in the DB):
 *
 *  - `trim-trailing-newline` — normalize CRLF → LF, strip trailing
 *    spaces/tabs on each line, drop a single trailing newline at EOF.
 *    This is the recommended default; it matches the visible-test
 *    comparison in `client/src/shared/runner/testHarness.ts`.
 *
 *  - `trim-all` — normalize CRLF → LF, then `.trim()` the whole string.
 *    More forgiving; use for free-form stdout.
 *
 *  - `exact` — no transformation. Use sparingly; will fail on any
 *    trailing whitespace difference.
 */
export function canonicalize(
  output: string,
  id: CanonicalizationId = 'trim-trailing-newline'
): string {
  switch (id) {
    case 'trim-trailing-newline':
      return output
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n$/, '');

    case 'trim-all':
      return output.replace(/\r\n/g, '\n').trim();

    case 'exact':
      return output;
  }
}