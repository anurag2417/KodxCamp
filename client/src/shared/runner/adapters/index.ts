import type { RunnerAdapter } from './types';
import { javascriptAdapter } from './javascript';
import { pythonAdapter } from './python';
import { rubyAdapter } from './ruby';
import { javaAdapter } from './java';
import { sqlAdapter } from './sql';
import { htmlAdapter } from './html';

export type { RunnerAdapter, AdapterRunOptions, HiddenRunResult } from './types';

const ALL_ADAPTERS: RunnerAdapter[] = [
  javascriptAdapter,
  pythonAdapter,
  rubyAdapter,
  javaAdapter,
  sqlAdapter,
  htmlAdapter,
];

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

export function getAdapter(language: string): RunnerAdapter | undefined {
  return ADAPTER_BY_LANGUAGE.get(language.toLowerCase());
}

export function listAdapters(): readonly RunnerAdapter[] {
  return ALL_ADAPTERS;
}