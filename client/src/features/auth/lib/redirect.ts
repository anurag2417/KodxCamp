/**
 * `?next=` redirect helper for auth flows.
 *
 * Every auth page that can be reached from a public surface (Practice,
 * Compiler, Roadmaps) reads a `next` query parameter that says where
 * to send the user after a successful sign-in. The value is
 * user-controlled, so it must be validated before use — otherwise an
 * attacker can craft a link like:
 *
 *   /login?next=https://evil.example/steal
 *
 * and redirect the freshly authenticated user to a hostile page.
 *
 * The rules below are the minimum needed to prevent that:
 *
 *   1. The value must start with a single `/` (an in-app absolute
 *      path). This rules out `http://…`, `javascript:…`, and
 *      anything else that could escape the app.
 *
 *   2. The value must NOT start with `//` (protocol-relative URL).
 *      `//evil.example` is treated by browsers as
 *      `https://evil.example`, and would otherwise pass rule 1.
 *
 *   3. The value must NOT contain a newline, carriage return, or
 *      other control character. Browsers historically tolerated
 *      these in redirect targets; keeping them out prevents
 *      header-injection-style edge cases and log-spoofing.
 *
 * When the value fails validation, or isn't present, the fallback is
 * the app's default landing page for a signed-in student.
 */
const DEFAULT_NEXT = '/my-learning';

export function resolveNext(search: string): string {
  const params = new URLSearchParams(search);
  const raw = params.get('next');
  if (!raw) return DEFAULT_NEXT;
  return sanitizeNext(raw);
}

/**
 * Sanitize a `next` value. Exported separately so callers that
 * already have the string (rather than a search string) can use it
 * without re-parsing.
 */
export function sanitizeNext(raw: string): string {
  if (raw.length === 0) return DEFAULT_NEXT;
  if (!raw.startsWith('/')) return DEFAULT_NEXT;
  if (raw.startsWith('//')) return DEFAULT_NEXT;

  // Reject control characters. Anything in the ASCII control range
  // (0x00–0x1F) or DEL (0x7F) is out — no reason for a legitimate
  // in-app path to contain them.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(raw)) return DEFAULT_NEXT;

  return raw;
}

/**
 * Append a `next` parameter to an auth path, preserving any other
 * query parameters that might already be there.
 *
 *   withNext('/login', '/practice/two-sum')
 *     → '/login?next=%2Fpractice%2Ftwo-sum'
 *
 *   withNext('/signup/verify?email=a%40b.com', '/practice/two-sum')
 *     → '/signup/verify?email=a%40b.com&next=%2Fpractice%2Ftwo-sum'
 */
export function withNext(path: string, next: string): string {
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('next', next);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}