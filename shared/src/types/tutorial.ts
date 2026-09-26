/**
 * Tutorial Challenges.
 *
 * Master Spec, section 4:
 *   "Tutorial Challenges are FreeCodeCamp-style guided exercises.
 *    They are designed to teach one concept at a time. They should
 *    not be treated as large projects."
 *
 * And section 5:
 *   "Tutorial Challenges should use deterministic automated
 *    validation. AI should normally NOT be responsible for evaluating
 *    Tutorial Challenges."
 *
 * A challenge belongs to exactly one lesson and has no identity
 * outside that context, so it lives embedded on `Lesson` rather than
 * in its own collection — same reasoning as `Problem.testCases`.
 *
 * The check engine that evaluates these is entirely client-side. See
 * `client/src/shared/runner/checkEngine.ts`. The server stores the
 * challenge definitions (for the author to edit) and stores the
 * student's per-challenge completion on `Progress`, but the verdict
 * itself is trusted from the client.
 */

/**
 * Deterministic check primitives.
 *
 * Two types for v1:
 *
 *   - `includes`: the raw source contains a substring. Used for HTML
 *     tags `<h1>`, CSS selectors `.heading {`, JS keywords
 *     `const `. Cheap, precise for "does this token appear".
 *
 *   - `dom`: the source is parsed as HTML and a CSS selector is
 *     queried against the resulting document. Used for "the heading
 *     says Hello" style checks. `expect` describes what to assert
 *     about the matched element(s).
 *
 * Both are deterministic. Both are computed on the client. Both are
 * honest — they check what they say they check. Adding a `regex`
 * primitive or a JS AST primitive later is a one-file change to the
 * check engine.
 */
export type ChallengeCheck =
  | {
      type: 'includes';
      /** The substring that must be present in the source. */
      value: string;
      /** Optional human-readable label shown in the UI. */
      label?: string;
    }
  | {
      type: 'dom';
      /** CSS selector to query. */
      selector: string;
      /** What to assert about the match. */
      expect: 'exists' | 'textEquals' | 'textMatches';
      /** Required for `textEquals` / `textMatches`. */
      value?: string;
      /** Optional human-readable label shown in the UI. */
      label?: string;
    };

/**
 * One tutorial challenge.
 *
 * `starterCode` is the code the student sees when they open the
 * challenge. It's usually a partial solution with a `// TODO` or an
 * unfinished HTML tag. The student fills it in, runs the checks, and
 * moves on when every check passes.
 */
export interface ITutorialChallenge {
  /** Short title — shown as the challenge header. */
  title: string;
  /**
   * Markdown-ish instructions shown above the editor. Short — one or
   * two sentences. The Master Spec calls these "guided exercises",
   * not essays.
   */
  instructions: string;
  /** Optional hint, shown behind a toggle. */
  hint?: string;
  /**
   * The code the student starts with. For web challenges this is HTML
   * (the CSS and JS are embedded in `<style>` and `<script>` tags
   * within the same document, since a challenge is a single-artifact
   * exercise, not a multi-file project).
   */
  starterCode: string;
  /** The checks that must all pass for this challenge to be complete. */
  checks: ChallengeCheck[];
  /**
   * Free-form string used to identify the language of the starter
   * code. Usually `'html'` for web challenges. Reserved for future
   * programming-language challenges (`'javascript'`, `'python'`).
   */
  language: string;
}

/**
 * A single challenge's outcome after running its checks.
 * Client-only type — never persisted.
 */
export interface IChallengeCheckResult {
  check: ChallengeCheck;
  passed: boolean;
  /**
   * Human-readable explanation of the failure. Set only when
   * `passed` is false. Example: `Expected <h1> to exist, but no
   * element matched`.
   */
  message?: string;
}

/**
 * The outcome of running every check for one challenge.
 */
export interface IChallengeRunResult {
  passed: boolean;
  results: IChallengeCheckResult[];
}