import { api } from '@/shared/lib/api';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SubmissionStatus =
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'compile_error';

export interface ApiProblemSummary {
  _id: string;
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  solved?: boolean;
}

export interface ApiProblemTestCase {
  index: number;
  input: string;
  expectedOutput: string;
  /** Display flag. Hide input/output from the student's test panel. */
  isHidden: boolean;
}

export interface ApiProblemFull {
  _id: string;
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: 'return' | 'print';
  starterCode: Record<string, string>;
  testCases: ApiProblemTestCase[];
  solved?: boolean;
}

export interface ApiSubmission {
  _id: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
  createdAt: string;
}

export interface SubmitInput {
  problemId: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
}

export const problemsApi = {
  list: async (): Promise<ApiProblemSummary[]> => {
    const { data } = await api.get('/problems');
    return data.data;
  },

  getBySlug: async (slug: string): Promise<ApiProblemFull> => {
    const { data } = await api.get(`/problems/${slug}`);
    return data.data;
  },

  /**
   * @deprecated - use `submit` with the legacy payload.
   */
  validate: async (input: {
    problemId: string;
    reportedResults: { index: number; passed: boolean }[];
  }): Promise<{
    status: SubmissionStatus;
    passedCount: number;
    totalTests: number;
  }> => {
    const { data } = await api.post('/problems/validate', input);
    return data.data;
  },

  submit: async (input: SubmitInput): Promise<ApiSubmission> => {
    const { data } = await api.post('/problems/submit', input);
    return data.data;
  },

  submissions: async (problemId: string): Promise<ApiSubmission[]> => {
    const { data } = await api.get(`/problems/${problemId}/submissions`);
    return data.data;
  },
};