import type { RunResult } from '../types';
import type { CanonicalizationId } from '@kodxcamp/shared';
import type {
  RunnerAdapter,
  AdapterRunOptions,
  HiddenRunResult,
} from './types';
import {
  runRuby,
  runRubyHidden,
  preloadRuby,
  isRubyReady,
} from '../rubyRunner';

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
    return runRuby(code, { timeoutMs: opts.timeoutMs ?? 15_000 });
  },

  async runHidden(
    code: string,
    _input: string,
    expectedOutputHash: string,
    canonicalization: CanonicalizationId,
    opts: AdapterRunOptions
  ): Promise<HiddenRunResult> {
    return runRubyHidden(code, expectedOutputHash, canonicalization, {
      timeoutMs: opts.timeoutMs ?? 15_000,
    });
  },
};