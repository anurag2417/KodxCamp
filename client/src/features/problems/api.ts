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
}

/**
 * A hidden test case. The server sends the input so the client can run
 * it, but never sends the expected output — only a SHA-256 hash of it.
 * See the project brief §4.3.1.
 */
export interface ApiHiddenTestCase {
  /** Stable id: `${problemId}:${index}` on the server. */
  id: string;
  input: string;
  /** 64-char lowercase hex. SHA-256 of the canonicalized expected output. */
  expectedOutputHash: string;
  canonicalization: 'trim-trailing-newline' | 'trim-all' | 'exact';
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
  /** Visible test cases — plaintext in, plaintext out. */
  testCases: ApiProblemTestCase[];
  /** Hidden test cases — hash-only. */
  hiddenTestCases: ApiHiddenTestCase[];
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
  sessionId?: string;
  hiddenResults?: { id: string; passed: boolean }[];
  createdAt: string;
}

// ─── Submission payload ───────────────────────────────────────────

export interface SubmitStructuredInput {
  problemId: string;
  language: string;
  code: string;
  sessionId: string;
  visibleResults: { index: number; passed: boolean }[];
  hiddenResults: { id: string; passed: boolean }[];
  runtimeMs?: number;
}

export interface SubmitLegacyInput {
  problemId: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
}

export type SubmitInput = SubmitStructuredInput | SubmitLegacyInput;

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
   * @deprecated — use `submit` with the structured payload instead.
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