import type { RunResult } from '../types';
import type { CanonicalizationId } from '@kodxcamp/shared';
import type {
  RunnerAdapter,
  AdapterRunOptions,
  HiddenRunResult,
} from './types';
import {
  runJavaCode,
  runJavaHiddenCode,
  preloadJava,
  isJavaReady,
} from '../javaRunner';

/**
 * Java adapter (CheerpJ).
 *
 * Java runs on the main thread, so hidden tests fail closed — see
 * HIDDEN-TESTS.md and the comment in javaRuntime.ts for the reasoning.
 */
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
    return runJavaCode(code, { timeoutMs: opts.timeoutMs ?? 30_000 });
  },

  async runHidden(
    _code: string,
    _input: string,
    _expectedOutputHash: string,
    _canonicalization: CanonicalizationId,
    _opts: AdapterRunOptions
  ): Promise<HiddenRunResult> {
    return runJavaHiddenCode();
  },
};