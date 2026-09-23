import type { RunResult, RunnerOptions } from '../types';
import type { CanonicalizationId } from '@kodxcamp/shared';

/**
 * Options passed to every adapter call.
 *
 * Extends the runner's base options with fields that only make sense
 * for certain languages (e.g. `stdin` for C/C++ and Ruby, `className`
 * for Java).
 */
export interface AdapterRunOptions extends RunnerOptions {
  /** Milliseconds before the worker is terminated. Default 10000. */
  timeoutMs?: number;
}

/**
 * The result of a hidden-test run.
 *
 * Deliberately does NOT include stdout or any other output field. The
 * adapter hashes the output internally and returns only the boolean.
 */
export interface HiddenRunResult {
  passed: boolean;
  runtimeMs: number;
}

/**
 * Every language runtime implements this interface.
 *
 * `init` is optional — languages that self-load (JS, Python) omit it.
 * Languages that need a warm-up (Java, Ruby) implement it so the UI
 * can show a loading state.
 *
 * `runHidden` is only called for hidden tests. It must hash the output
 * inside the runtime boundary and return only a boolean. If the runtime
 * cannot isolate hashing from the page (as is currently the case for
 * SQL and HTML), `runHidden` should return `{ passed: false }` rather
 * than leak the output.
 */
export interface RunnerAdapter {
  /** Stable identifier matching the DB's `language` field. */
  readonly id: string;

  /**
   * Human-readable label for UI. Not required to be unique.
   */
  readonly label: string;

  /**
   * Languages this adapter also handles under a different `id`.
   * Example: the JavaScript adapter handles both `javascript` and
   * `dsa-javascript`. Example: the Python adapter handles both
   * `python` and `dsa-python`.
   */
  readonly aliases: readonly string[];

  /**
   * Prepare the runtime. Idempotent. Called lazily by the UI when the
   * student selects a language that needs warming up.
   */
  init?(): Promise<void>;

  /**
   * Whether the runtime is ready to execute. Used to render a loading
   * state in the toolbar.
   */
  isReady(): boolean;

  /**
   * Run code with the given input, return the full RunResult.
   * Used by visible tests and the playground.
   */
  run(
    code: string,
    input: string,
    opts: AdapterRunOptions
  ): Promise<RunResult>;

  /**
   * Run code and hash the output inside the runtime boundary.
   * Used by hidden tests.
   *
   * Contract: the raw output MUST NOT cross this boundary. If the
   * runtime cannot enforce that, return `{ passed: false, runtimeMs }`.
   */
  runHidden(
    code: string,
    input: string,
    expectedOutputHash: string,
    canonicalization: CanonicalizationId,
    opts: AdapterRunOptions
  ): Promise<HiddenRunResult>;
}

/**
 * Normalize a language id to its canonical adapter id.
 * Returns `null` if the language has no adapter.
 */
export function canonicalizeLanguageId(language: string): string | null {
  const l = language.toLowerCase();
  // Direct id match
  return l;
}