import type { RunResult } from '../types';
import type { CanonicalizationId } from '@kodxcamp/shared';
import type { RunnerAdapter, AdapterRunOptions, HiddenRunResult } from './types';
import { runSql } from '../sqlRunner';

/**
 * SQL adapter.
 *
 * SQL.js runs on the main thread, so hidden tests cannot hash the
 * output inside an isolated Worker. `runHidden` returns
 * `{ passed: false }` unconditionally — this is the fail-closed
 * behavior documented in HIDDEN-TESTS.md.
 *
 * Once SQL.js runs inside a Worker, `runHidden` can be implemented
 * by hashing inside the Worker.
 */
export const sqlAdapter: RunnerAdapter = {
  id: 'sql',
  label: 'SQL',
  aliases: [],

  isReady: () => true,

  async run(
    code: string,
    _input: string,
    opts: AdapterRunOptions
  ): Promise<RunResult> {
    return runSql(code, { timeoutMs: opts.timeoutMs ?? 5000 });
  },

  async runHidden(
    _code: string,
    _input: string,
    _expectedOutputHash: string,
    _canonicalization: CanonicalizationId,
    _opts: AdapterRunOptions
  ): Promise<HiddenRunResult> {
    return { passed: false, runtimeMs: 0 };
  },
};