import type {
  ChallengeCheck,
  IChallengeCheckResult,
  IChallengeRunResult,
} from '@kodxcamp/shared';

/**
 * Tutorial-challenge check engine.
 *
 * Master Spec, section 5:
 *   "Tutorial Challenges should use deterministic automated
 *    validation. AI should normally NOT be responsible for evaluating
 *    Tutorial Challenges."
 *
 * This module is the entire "automated validation" for a challenge.
 * It runs on the client. It is synchronous. It does not fetch
 * anything.
 *
 * Two check primitives are supported today:
 *
 *   - `includes`: the source contains a substring.
 *   - `dom`: the source is parsed as HTML and a CSS selector is
 *     queried against the result.
 *
 * Adding a third primitive later — e.g. a `regex` check, or a JS AST
 * check via a small parser — is a change to this file, no more. The
 * server does not need to know. The lesson schema needs a new variant
 * in its discriminated union, but the runner is agnostic.
 */

/**
 * Run every check against the source and return the combined result.
 * Order is preserved so the UI can show the checks in the order the
 * author wrote them.
 */
export function runChallengeChecks(
  source: string,
  checks: ChallengeCheck[]
): IChallengeRunResult {
  const results = checks.map((check) => runOne(source, check));
  return {
    passed: results.every((r) => r.passed),
    results,
  };
}

/**
 * Run one check. Never throws — parse failures and unsupported check
 * types are reported as failed checks with a message.
 */
function runOne(source: string, check: ChallengeCheck): IChallengeCheckResult {
  try {
    if (check.type === 'includes') {
      return runIncludes(source, check);
    }
    if (check.type === 'dom') {
      return runDom(source, check);
    }
    return {
      check,
      passed: false,
      message: `Unsupported check type: ${(check as { type: string }).type}`,
    };
  } catch (err) {
    return {
      check,
      passed: false,
      message:
        err instanceof Error
          ? `Check failed to run: ${err.message}`
          : 'Check failed to run',
    };
  }
}

/* ─── includes ───────────────────────────────────────────────────── */

function runIncludes(
  source: string,
  check: Extract<ChallengeCheck, { type: 'includes' }>
): IChallengeCheckResult {
  const present = source.includes(check.value);
  return {
    check,
    passed: present,
    message: present
      ? undefined
      : `Expected the code to contain "${truncate(check.value)}".`,
  };
}

/* ─── dom ────────────────────────────────────────────────────────── */

function runDom(
  source: string,
  check: Extract<ChallengeCheck, { type: 'dom' }>
): IChallengeCheckResult {
  const doc = parseHtml(source);
  if (!doc) {
    return {
      check,
      passed: false,
      message: 'The code could not be parsed as HTML.',
    };
  }

  const matches = doc.querySelectorAll(check.selector);

  if (check.expect === 'exists') {
    const passed = matches.length > 0;
    return {
      check,
      passed,
      message: passed
        ? undefined
        : `Expected an element matching "${check.selector}" to exist.`,
    };
  }

  // For textEquals and textMatches we need at least one match.
  if (matches.length === 0) {
    return {
      check,
      passed: false,
      message: `No element matched "${check.selector}".`,
    };
  }

  const expected = check.value ?? '';
  const firstText = normalizeText(matches[0].textContent ?? '');

  if (check.expect === 'textEquals') {
    const passed = firstText === normalizeText(expected);
    return {
      check,
      passed,
      message: passed
        ? undefined
        : `Expected "${check.selector}" to say "${truncate(
            expected
          )}", but it says "${truncate(firstText)}".`,
    };
  }

  // textMatches — expected is a regex source string. Match against
  // the normalized text. Failure to compile the regex is a check
  // error, not a student error.
  let re: RegExp;
  try {
    re = new RegExp(expected);
  } catch {
    return {
      check,
      passed: false,
      message: `The check's regex "${expected}" is not valid.`,
    };
  }

  const passed = re.test(firstText);
  return {
    check,
    passed,
    message: passed
      ? undefined
      : `Expected "${check.selector}" to match /${truncate(
          expected
        )}/, but it says "${truncate(firstText)}".`,
  };
}

/* ─── helpers ────────────────────────────────────────────────────── */

/**
 * Parse an HTML source string with DOMParser. Returns null on parse
 * failure. Also returns null when DOMParser is not available (SSR,
 * tests running in a non-DOM environment) so the caller can degrade
 * gracefully.
 */
function parseHtml(source: string): Document | null {
  if (typeof DOMParser === 'undefined') return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, 'text/html');
    // DOMParser does not throw on malformed HTML — it recovers. We
    // only reject if the document is entirely empty in a way that
    // indicates a catastrophic parse failure. A `<parsererror>` tag
    // is the standard signal in XML mode, not HTML, so we don't
    // check for it here.
    if (!doc.body && !doc.documentElement) return null;
    return doc;
  } catch {
    return null;
  }
}

/**
 * Normalize text for comparison: trim, collapse internal whitespace
 * to a single space. This lets the author write the expected text
 * however they like without the student's indentation being the
 * difference between pass and fail.
 */
function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Truncate a string for display in an error message.
 */
function truncate(s: string, max = 60): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}