import type { CanonicalizationId } from '@kodxcamp/shared';

/**
 * Shared types for the hidden-test runner.
 *
 * Kept in a separate module so `hiddenHarness.ts` can import them
 * without introducing a circular dependency when the adapter registry
 * is imported by the harness.
 */

export type OutputMode = 'return' | 'print';

export interface HiddenTestCase {
  id: string;
  input: string;
  expectedOutputHash: string;
  canonicalization: CanonicalizationId;
}

export interface HiddenTestOutcome {
  id: string;
  passed: boolean;
}

export interface HiddenRunOptions {
  functionName?: string;
  outputMode?: OutputMode;
  timeoutMs?: number;
  onProgress?: (outcome: HiddenTestOutcome, index: number) => void;
}