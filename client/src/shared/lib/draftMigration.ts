/**
 * Guest → signed-in draft migration.
 *
 * The problem editor and the playground store drafts in
 * `localStorage` under keys that are scoped by user id, with the
 * literal string `guest` standing in for anonymous visitors:
 *
 *   problem:guest:{problemId}:{language}       (guest)
 *   problem:{userId}:{problemId}:{language}    (signed in)
 *
 * This is the right storage scheme: it keeps one user's drafts
 * invisible to another on a shared machine. But it also means that
 * when a guest types code, hits Submit, signs in, and returns to the
 * problem, the editor loads under a *new* key and their draft is
 * gone.
 *
 * This module closes that gap. On every session establishment
 * (`setSession`, `login`, `loginWithGoogle`, `fetchMe`), we scan
 * `localStorage` for keys containing the literal `:guest:` segment
 * and re-key them to `:{userId}:`. The old keys are removed. If a
 * user-scoped key already exists for the same draft (which can
 * happen if the user was signed in, logged out, typed a guest
 * draft, and logged back in — rare but possible), the user-scoped
 * key wins and the guest key is dropped.
 *
 * The migration is idempotent: it can run any number of times with
 * no adverse effect. It is also synchronous and tiny — a single
 * pass over `localStorage` — so it doesn't need a loading state.
 *
 * Scope: this module handles *all* known draft prefixes. If new
 * draft-holding features are added, add their prefix to
 * `DRAFT_PREFIXES` below.
 */

/**
 * Every prefix that a draft key can start with.
 *
 * `problem:`   — problem editor drafts, including web-lesson
 *                multi-file drafts (which append `:files`).
 * `playground:` — compiler drafts.
 *
 * Keeping this as an explicit list, rather than a regex, means
 * adding a new draft-holding feature is a one-line change, and it
 * cannot accidentally catch unrelated keys.
 */
const DRAFT_PREFIXES = ['problem:', 'playground:'];

/**
 * The exact segment that marks a guest-scoped key. Matched as a
 * literal `:guest:` so a key like `problem:myguest:draft` (which
 * shouldn't exist, but might through a typo) does not accidentally
 * trigger a migration.
 */
const GUEST_SEGMENT = ':guest:';

export function migrateGuestDrafts(userId: string): void {
  if (typeof window === 'undefined') return;
  if (!userId) return;

  // localStorage's `length` changes as we remove keys, so iterate
  // once to collect, then act. Iterating and mutating in the same
  // loop would skip keys.
  const keysToMigrate: string[] = [];

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (!DRAFT_PREFIXES.some((p) => key.startsWith(p))) continue;
      if (!key.includes(GUEST_SEGMENT)) continue;
      keysToMigrate.push(key);
    }
  } catch {
    // localStorage can throw in private-browsing modes with strict
    // quotas. There is no recovery; the migration simply doesn't
    // run. The user still gets a working app; their drafts just
    // don't carry over.
    return;
  }

  for (const guestKey of keysToMigrate) {
    try {
      const userKey = guestKey.replace(GUEST_SEGMENT, `:${userId}:`);

      const value = window.localStorage.getItem(guestKey);
      if (value === null) continue;

      // If the user already had a draft under this exact key, keep
      // the user's — they typed it while signed in, and that's the
      // more recent intent. The guest key is dropped regardless.
      const existing = window.localStorage.getItem(userKey);
      if (existing === null) {
        window.localStorage.setItem(userKey, value);
      }

      window.localStorage.removeItem(guestKey);
    } catch {
      // A single key failing to migrate doesn't stop the others.
      // Skip and continue.
    }
  }
}