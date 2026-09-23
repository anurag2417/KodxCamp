import type { RunResult } from '../types';
import type { RunnerAdapter, AdapterRunOptions } from './types';
import { runJavaScript } from '../jsRunner';

export const javascriptAdapter: RunnerAdapter = {
  id: 'javascript',
  label: 'JavaScript',
  aliases: ['dsa-javascript', 'typescript'],

  isReady: () => true,

  async run(
    code: string,
    _input: string,
    opts: AdapterRunOptions
  ): Promise<RunResult> {
    return runJavaScript(code, { timeoutMs: opts.timeoutMs ?? 30000 });
  },
};