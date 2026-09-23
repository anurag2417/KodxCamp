import type { RunResult } from '../types';
import type { RunnerAdapter, AdapterRunOptions } from './types';
import { runSql } from '../sqlRunner';

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
};