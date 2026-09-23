import type { RunResult } from '../types';
import type { CanonicalizationId } from '@kodxcamp/shared';
import type { RunnerAdapter, AdapterRunOptions, HiddenRunResult } from './types';
import { runHtml } from '../htmlRunner';

/**
 * HTML/CSS/Tailwind/React adapter.
 *
 * Runs in a sandboxed iframe on the main thread. Same fail-closed
 * posture as SQL for hidden tests.
 */
export const htmlAdapter: RunnerAdapter = {
  id: 'html-css',
  label: 'HTML / CSS',
  aliases: ['tailwind', 'react'],

  isReady: () => true,

  async run(code: string, _input: string, _opts: AdapterRunOptions): Promise<RunResult> {
    return runHtml(code);
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