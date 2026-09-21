export type Verdict =
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'runtime_error'
  | 'compile_error'
  | 'unsupported';

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  verdict: Verdict;
  runtimeMs: number;
}

export interface RunnerOptions {
  /** ms before the worker is terminated. Default 5000. */
  timeoutMs?: number;
  /** For programs that read from stdin (none of our lessons yet — reserved). */
  stdin?: string;
}

export interface LanguageRunner {
  run(code: string, opts?: RunnerOptions): Promise<RunResult>;
}
