import type { RunResult } from '../types';
import type { RunnerAdapter, AdapterRunOptions } from './types';
import { runJavaCode, preloadJava, isJavaReady } from '../javaRunner';

export const javaAdapter: RunnerAdapter = {
  id: 'java',
  label: 'Java',
  aliases: [],

  async init(): Promise<void> {
    await preloadJava();
  },

  isReady: () => isJavaReady(),

  async run(
    code: string,
    _input: string,
    opts: AdapterRunOptions
  ): Promise<RunResult> {
    return runJavaCode(code, { timeoutMs: opts.timeoutMs ?? 60000 });
  },
};