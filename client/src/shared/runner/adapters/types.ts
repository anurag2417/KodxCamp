import type { RunnerOptions } from '../types';

export interface AdapterRunOptions extends RunnerOptions {
  timeoutMs?: number;
}

export interface RunnerAdapter {
  readonly id: string;
  readonly label: string;
  readonly aliases: readonly string[];
  init?(): Promise<void>;
  isReady(): boolean;
  run(
    code: string,
    input: string,
    opts: AdapterRunOptions
  ): Promise<import('../types').RunResult>;
}