import type { RunResult } from '../types';
import type { CanonicalizationId } from '@kodxcamp/shared';
import type { RunnerAdapter, AdapterRunOptions, HiddenRunResult } from './types';
import { runJavaScript, runJavaScriptHidden } from '../jsRunner';

/**
 * Adapter for JavaScript (and TypeScript after a naive strip, and
 * `dsa-javascript`).
 *
 * TypeScript is handled by stripping type annotations before passing to
 * the JS worker. That's a lossy shortcut, adequate for lesson-sized
 * snippets but not for real TypeScript. Documented in the brief.
 */
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
    return runJavaScript(code, { timeoutMs: opts.timeoutMs ?? 10000 });
  },

  async runHidden(
    code: string,
    _input: string,
    expectedOutputHash: string,
    canonicalization: CanonicalizationId,
    opts: AdapterRunOptions
  ): Promise<HiddenRunResult> {
    return runJavaScriptHidden(code, expectedOutputHash, canonicalization, {
      timeoutMs: opts.timeoutMs ?? 10000,
    });
  },
};