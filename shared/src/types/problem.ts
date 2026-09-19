export type Difficulty = 'easy' | 'medium' | 'hard';

export type ProblemOutputMode = 'return' | 'print';

export interface IProblemTestCase {
  input: string;
  expectedOutput: string;
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