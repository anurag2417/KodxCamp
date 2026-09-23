import type { RunResult } from '../types';
import type { CanonicalizationId } from '@kodxcamp/shared';
import type { RunnerAdapter, AdapterRunOptions, HiddenRunResult } from './types';
import {
  runPython,
  runPythonHidden,
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
    return runPython(code, { timeoutMs: opts.timeoutMs ?? 10000 });
  },

  async runHidden(
    code: string,
    _input: string,
    expectedOutputHash: string,
    canonicalization: CanonicalizationId,
    opts: AdapterRunOptions
  ): Promise<HiddenRunResult> {
    return runPythonHidden(code, expectedOutputHash, canonicalization, {
      timeoutMs: opts.timeoutMs ?? 10000,
    });
  },
};