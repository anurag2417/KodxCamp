export type Difficulty = 'easy' | 'medium' | 'hard';

export type ProblemOutputMode = 'return' | 'print';

/**
 * A single test case attached to a problem.
 *
 * `expectedOutput` is always stored in plaintext. `isHidden` is a
 * DISPLAY FLAG ONLY — it controls whether the client shows the test's
 * input and expected output to the student while they work. It is NOT
 * a security boundary: every test runs on every submission, and the
 * pass/fail counts toward the final verdict regardless.
 *
 * Do not treat `isHidden` as protection against a student who controls
 * the browser. See the project brief for the honest posture on
 * browser-only judging.
 */
export interface IProblemTestCase {
  input: string;
  expectedOutput: string;
  /** Display flag. Hide the input/output from the student's test panel. */
  isHidden: boolean;
}

export interface IProblem {
  _id: string;
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: ProblemOutputMode;
  starterCode: Record<string, string>;
  testCases: IProblemTestCase[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubmission {
  _id: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
  createdAt: Date;
}