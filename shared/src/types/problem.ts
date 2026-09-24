export type Difficulty = 'easy' | 'medium' | 'hard';

export type ProblemOutputMode = 'return' | 'print';

export type ProblemScope = 'global' | 'course';

export type ProblemTier = 'starter' | 'interview';

/**
 * A single test case attached to a problem.
 *
 * `expectedOutput` is always stored in plaintext. `isHidden` is a
 * DISPLAY FLAG ONLY - it controls whether the client shows the test's
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
  isHidden: boolean;
}

export interface IProblem {
  _id: string;
  /**
   * 5-digit public identifier assigned by the backend.
   *
   * Programming problems: 10001, 10002, 10003, ...
   * SQL problems:         20001, 20002, 20003, ...
   *
   * Never supplied by the client. Never edited. Stable once assigned.
   */
  problemId: number;
  /**
   * @deprecated Legacy sequence number from before the problemId
   * system. Still returned for one batch for backwards compatibility.
   * Drop in a later batch.
   */
  number?: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: ProblemOutputMode;
  /**
   * Map of language id (or web filename) -> starter code.
   */
  starterCode: Record<string, string>;
  testCases: IProblemTestCase[];
  /**
   * SQL-only. A block of SQL executed once against the SQL.js database
   * before any test case runs.
   */
  sqlSetup?: string;
  /**
   * Visibility scope.
   *
   *   - `global` -> appears in the global `/practice` catalog.
   *   - `course` -> hidden from the global catalog; only reachable
   *     through a lesson that references it via `problemSlug`, and
   *     only for users with access to that course.
   */
  scope: ProblemScope;
  /**
   * Required when `scope === 'course'`, ignored otherwise.
   */
  courseId?: string;
  /**
   * Content tier. `starter` is the initial batch of learning problems;
   * `interview` is the industry-grade set for interview prep.
   */
  tier: ProblemTier;
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