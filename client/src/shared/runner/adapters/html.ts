import type { RunResult } from '../types';
import type { RunnerAdapter, AdapterRunOptions } from './types';
import { runHtml } from '../htmlRunner';

export const htmlAdapter: RunnerAdapter = {
  id: 'html-css',
  label: 'HTML / CSS',
  aliases: ['tailwind', 'react'],

  isReady: () => true,

  async run(
    code: string,
    _input: string,
    _opts: AdapterRunOptions
  ): Promise<RunResult> {
    return runHtml(code);
  },
};