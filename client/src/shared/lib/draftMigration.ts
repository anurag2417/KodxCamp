/**
 * Guest → signed-in draft migration.
 *
 * The problem editor, playground, and lesson pages store drafts in
 * `localStorage` under keys that are scoped by user id, with the
 * literal string `guest` standing in for anonymous visitors:
 *
 *   kodxcamp:problem:guest:{problemId}:{language}       (guest)
 *   kodxcamp:problem:{userId}:{problemId}:{language}    (signed in)
 *
 * Every draft key is written through `shared/lib/storage.ts`, which
 * prepends the `kodxcamp:` namespace. This module MUST match that
 * namespace — it is the single biggest footgun in this file. An
 * earlier version scanned for bare `problem:` / `playground:`
 * prefixes and therefore silently migrated nothing.
 *
 * On every session establishment (`setSession`, `login`,
 * `loginWithGoogle`, `fetchMe`), we scan `localStorage` for keys
 * containing the literal `:guest:` segment *after* the namespace
 * prefix and re-key them to `:{userId}:`. The old keys are removed.
 * If a user-scoped key already exists for the same draft (a user
 * signed in, logged out, typed a guest draft, and logged back in —
 * rare but possible), the user-scoped key wins and the guest key is
 * dropped.
 *
 * The migration is idempotent: it can run any number of times with
 * no adverse effect. It is synchronous and small — one pass over
 * `localStorage`.
 */

/**
 * The namespace prefix used by `shared/lib/storage.ts`. Kept as a
 * constant here so the two modules cannot drift silently. If the
 * prefix changes in `storage.ts`, change it here too.
 *
 * NOTE: this is a deliberate duplicate rather than an import, because
 * `storage.ts` does not currently export the prefix. If you'd rather
 * avoid the duplication, export `STORAGE_PREFIX` from `storage.ts`
 * and import it here — but do NOT let one drift from the other.
 */
const STORAGE_PREFIX = 'kodxcamp:';

/**
 * Every draft-holding feature, expressed as the "middle" of the key
 * (everything between the namespace and the `guest:` / `{userId}:`
 * segment). Kept as an explicit list, not a regex, so adding a new
 * draft-holding feature is a one-line change and cannot accidentally
 * catch unrelated keys.
 */
const DRAFT_SEGMENTS = ['problem:', 'playground:', 'lesson:', 'tutorial:'];

/**
 * The exact segment that marks a guest-scoped key. Matched as a
 * literal `:guest:` so a key like `kodxcamp:problem:myguest:draft`
 * (which shouldn't exist, but might through a typo) does not
 * trigger a migration.
 */
const GUEST_SEGMENT = ':guest:';

export function migrateGuestDrafts(userId: string): void {
  if (typeof window === 'undefined') return;
  if (!userId) return;

  // localStorage's `length` changes as we remove keys, so iterate
  // once to collect, then act.
  const keysToMigrate: string[] = [];

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const rawKey = window.localStorage.key(i);
      if (!rawKey) continue;

      // Every draft is namespaced by `storage.ts`.
      if (!rawKey.startsWith(STORAGE_PREFIX)) continue;

      // The middle segment must be one of our known draft holders.
      const middle = rawKey.slice(STORAGE_PREFIX.length);
      if (!DRAFT_SEGMENTS.some((seg) => middle.startsWith(seg))) continue;

      // And it must be a guest-scoped key.
      if (!rawKey.includes(GUEST_SEGMENT)) continue;

      keysToMigrate.push(rawKey);
    }
  } catch {
    // localStorage can throw in private-browsing modes with strict
    // quotas. There is no recovery; the migration simply doesn't run.
    return;
  }

  for (const guestKey of keysToMigrate) {
    try {
      const userKey = guestKey.replace(GUEST_SEGMENT, `:${userId}:`);

      const value = window.localStorage.getItem(guestKey);
      if (value === null) continue;

      // If the user already had a draft under this exact key, keep
      // theirs. The guest key is dropped regardless.
      const existing = window.localStorage.getItem(userKey);
      if (existing === null) {
        window.localStorage.setItem(userKey, value);
      }

      window.localStorage.removeItem(guestKey);
    } catch {
      // A single key failing to migrate doesn't stop the others.
    }
  }
}