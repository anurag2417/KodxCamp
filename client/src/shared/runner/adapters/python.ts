import type { RunResult } from '../types';
import type { RunnerAdapter, AdapterRunOptions } from './types';
import {
  runPython,
  preloadPython,
  isPythonReady,
} from '../pythonRunner';

export const pythonAdapter: RunnerAdapter = {
  id: 'python',
  label: 'Python',
  aliases: ['dsa-python'],

  async init(): Promise<void> {
    await preloadPython();
  },

  isReady: () => isPythonReady(),

  async run(
    code: string,
    _input: string,
    opts: AdapterRunOptions
  ): Promise<RunResult> {
    return runPython(code, { timeoutMs: opts.timeoutMs ?? 30000 });
  },
};