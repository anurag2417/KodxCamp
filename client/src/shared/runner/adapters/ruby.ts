import type { RunResult } from '../types';
import type { RunnerAdapter, AdapterRunOptions } from './types';
import { runRuby, preloadRuby, isRubyReady } from '../rubyRunner';

export const rubyAdapter: RunnerAdapter = {
  id: 'ruby',
  label: 'Ruby',
  aliases: [],

  async init(): Promise<void> {
    await preloadRuby();
  },

  isReady: () => isRubyReady(),

  async run(
    code: string,
    _input: string,
    opts: AdapterRunOptions
  ): Promise<RunResult> {
    return runRuby(code, { timeoutMs: opts.timeoutMs ?? 30000 });
  },
};