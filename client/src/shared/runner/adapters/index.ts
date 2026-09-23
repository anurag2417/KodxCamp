import type { RunnerAdapter } from './types';
import { javascriptAdapter } from './javascript';
import { pythonAdapter } from './python';
import { sqlAdapter } from './sql';
import { htmlAdapter } from './html';

export type { RunnerAdapter, AdapterRunOptions, HiddenRunResult } from './types';

/**
 * The adapter registry. Every language the platform supports is listed
 * here exactly once, keyed by its canonical `id`.
 *
 * To add a language:
 *   1. Write `adapters/<lang>.ts` implementing `RunnerAdapter`.
 *   2. Import it here and add to `ALL_ADAPTERS`.
 *   3. If the language has aliases (e.g. `dsa-javascript` →
 *      `javascript`), include them in the adapter's `aliases` array.
 */
const ALL_ADAPTERS: RunnerAdapter[] = [
  javascriptAdapter,
  pythonAdapter,
  sqlAdapter,
  htmlAdapter,
];

/**
 * Build a lookup map: every alias and every id maps to its adapter.
 * Built once at module load.
 */
const ADAPTER_BY_LANGUAGE: Map<string, RunnerAdapter> = (() => {
  const map = new Map<string, RunnerAdapter>();
  for (const adapter of ALL_ADAPTERS) {
    map.set(adapter.id, adapter);
    for (const alias of adapter.aliases) {
      map.set(alias, adapter);
    }
  }
  return map;
})();

/**
 * Look up the adapter for a language id. Returns `undefined` if the
 * language is not supported.
 */
export function getAdapter(language: string): RunnerAdapter | undefined {
  return ADAPTER_BY_LANGUAGE.get(language.toLowerCase());
}

/**
 * All registered adapters. Useful for iterating the supported languages
 * in the UI.
 */
export function listAdapters(): readonly RunnerAdapter[] {
  return ALL_ADAPTERS;
}