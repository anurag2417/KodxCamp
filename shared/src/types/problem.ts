export type Difficulty = 'easy' | 'medium' | 'hard';

export type ProblemOutputMode = 'return' | 'print';

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
 *
 * SQL NOTE: for SQL problems, `input` is the query the student's
 * answer is expected to produce (usually empty - the setup lives in
 * `Problem.sqlSetup`). `expectedOutput` is the formatted result table
 * that the student's query must return.
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
  /**
   * SQL-only. A block of SQL executed once against the SQL.js database
   * before any test case runs. Typically contains CREATE TABLE and
   * INSERT statements that establish the schema and seed data the
   * student's query will run against.
   *
   * Empty/undefined for non-SQL problems, or for SQL problems that
   * test against tables the runner creates itself.
   *
   * The server performs a structural sanity check on save (balanced
   * parens, at least one CREATE TABLE and one INSERT INTO) but does
   * not execute it - execution happens in the browser.
   */
  sqlSetup?: string;
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