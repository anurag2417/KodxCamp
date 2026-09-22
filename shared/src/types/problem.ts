export type Difficulty = 'easy' | 'medium' | 'hard';

export type ProblemOutputMode = 'return' | 'print';

export type CanonicalizationId =
  | 'trim-trailing-newline'
  | 'trim-all'
  | 'exact';

/**
 * A single test case attached to a problem.
 *
 * Visible tests store `expectedOutput` in plaintext — the UI shows the
 * student what the code is supposed to produce.
 *
 * Hidden tests store only a SHA-256 hash of the canonicalized expected
 * output. The raw expected output never leaves the server after the
 * migration script has run. See the project brief §4.3.1.
 */
export interface IProblemTestCase {
  input: string;
  isHidden: boolean;

  /** Visible tests only. */
  expectedOutput?: string;

  /** Hidden tests only. Hex-encoded SHA-256 of the canonicalized output. */
  expectedOutputHash?: string;

  /** Hidden tests only. Which canonicalization was applied before hashing. */
  canonicalization?: CanonicalizationId;
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
  sessionId?: string;
  hiddenResults?: { id: string; passed: boolean }[];
  createdAt: Date;
}