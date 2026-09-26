import { api } from '@/shared/lib/api';
import type {
  IProjectTest,
  IProjectTestRun,
  IProjectScreenshotSet,
} from '@kodxcamp/shared';

export type ProjectCategory =
  | 'frontend'
  | 'react'
  | 'api'
  | 'sql'
  | 'dataviz'
  | 'javascript';

export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type PreviewMode = 'html' | 'react' | 'sql' | 'none';

export type ProjectMode = 'required' | 'recommended' | 'open_choice';

export interface ApiProjectFile {
  name: string;
  language: string;
  content: string;
  isEntry?: boolean;
}

export interface ApiProjectRubricCategory {
  category: string;
  weight: number;
}

export interface ApiProjectSpecification {
  objective?: string;
  requiredFeatures?: string[];
  technicalRequirements?: string[];
  designRequirements?: string[];
  accessibilityRequirements?: string[];
  expectedBehaviour?: string;
}

export interface ApiProjectSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  difficulty: ProjectDifficulty;
  topics: string[];
  estimatedMinutes: number;
  xpReward: number;
  previewMode: PreviewMode;
  mode: ProjectMode;
  userStatus: { status: string; completedAt?: string } | null;
}

export interface ApiProjectFull {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: ProjectCategory;
  difficulty: ProjectDifficulty;
  topics: string[];
  files: ApiProjectFile[];
  previewMode: PreviewMode;
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;

  mode: ProjectMode;
  specification: ApiProjectSpecification;
  rubric: ApiProjectRubricCategory[];

  tests: IProjectTest[];
}

export interface ApiUserProject {
  _id: string;
  userId: string;
  projectId: string;
  files: ApiProjectFile[];
  status: string;
  completedAt?: string;
  updatedAt: string;
}

export type ProjectSubmissionStatus =
  | 'submitted'
  | 'ai_evaluated'
  | 'instructor_reviewed'
  | 'passed'
  | 'needs_improvement'
  | 'resubmission_requested';

/**
 * The latest instructor review attached to a submission by the
 * server. Present only when the submission has been reviewed.
 *
 * This is a *snapshot* of the newest `InstructorEvaluation` for the
 * submission — not the full review history. The full history is
 * available on the instructor-side routes; the student sees the
 * latest review's score, feedback, and category overrides.
 */
export interface ApiInstructorFeedback {
  _id: string;
  instructorId: string;
  instructorName: string;
  revisionNumber: number;
  finalScore: number;
  categoryOverrides: {
    category: string;
    score: number;
    note?: string;
  }[];
  feedback: string;
  requestResubmission: boolean;
  status: 'passed' | 'needs_improvement' | 'resubmission_requested';
  evaluationDate: string;
}

export interface ApiProjectSubmission {
  _id: string;
  userId: string;
  projectId: string;
  attemptNumber: number;
  files: ApiProjectFile[];
  status: ProjectSubmissionStatus;
  submittedAt: string;
  notes?: string;

  testRun?: IProjectTestRun;
  screenshots?: IProjectScreenshotSet;

  /**
   * The latest instructor review of this submission, if any. The
   * server attaches it on read. Absent means the submission has not
   * been reviewed yet.
   */
  instructorFeedback?: ApiInstructorFeedback;

  createdAt: string;
  updatedAt: string;
}

export interface SubmitProjectInput {
  files?: ApiProjectFile[];
  notes?: string;
  testRun?: IProjectTestRun;
  screenshots?: IProjectScreenshotSet;
}

export const projectsApi = {
  list: async (): Promise<ApiProjectSummary[]> => {
    const { data } = await api.get('/projects');
    return data.data;
  },

  getBySlug: async (
    slug: string
  ): Promise<{ project: ApiProjectFull; userProject: ApiUserProject | null }> => {
    const { data } = await api.get(`/projects/${slug}`);
    return data.data;
  },

  start: async (
    slug: string
  ): Promise<{ project: ApiProjectFull; userProject: ApiUserProject }> => {
    const { data } = await api.post(`/projects/${slug}/start`);
    return data.data;
  },

  save: async (slug: string, files: ApiProjectFile[]): Promise<ApiUserProject> => {
    const { data } = await api.post(`/projects/${slug}/save`, { files });
    return data.data;
  },

  complete: async (slug: string): Promise<ApiUserProject> => {
    const { data } = await api.post(`/projects/${slug}/complete`);
    return data.data;
  },

  mine: async (): Promise<
    {
      _id: string;
      status: string;
      completedAt?: string;
      updatedAt: string;
      project: ApiProjectFull;
    }[]
  > => {
    const { data } = await api.get('/projects/mine');
    return data.data;
  },

  submit: async (
    slug: string,
    input: SubmitProjectInput = {}
  ): Promise<ApiProjectSubmission> => {
    const { data } = await api.post(`/projects/${slug}/submit`, input);
    return data.data;
  },

  submissions: async (slug: string): Promise<ApiProjectSubmission[]> => {
    const { data } = await api.get(`/projects/${slug}/submissions`);
    return data.data;
  },

  submission: async (submissionId: string): Promise<ApiProjectSubmission> => {
    const { data } = await api.get(`/projects/submissions/${submissionId}`);
    return data.data;
  },
};

/* ─── Payments ───────────────────────────────────────────────────── */

export interface PaymentConfig {
  configured: boolean;
  mode: 'test' | 'live';
  keyId?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  title: string;
}

export interface PaymentEntityRef {
  kind: 'course' | 'roadmap';
  id: string;
}

export const paymentsApi = {
  config: async (): Promise<PaymentConfig> => {
    const { data } = await api.get('/payments/config');
    return data.data;
  },

  createOrderFor: async (
    ref: PaymentEntityRef
  ): Promise<CreateOrderResponse> => {
    const { data } = await api.post('/payments/create-order', ref);
    return data.data;
  },

  verify: async (input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<{ ok: boolean }> => {
    const { data } = await api.post('/payments/verify', input);
    return data.data;
  },

  enrollFreeFor: async (
    ref: PaymentEntityRef
  ): Promise<{ ok: boolean; alreadyEnrolled: boolean }> => {
    const { data } = await api.post('/payments/enroll-free', ref);
    return data.data;
  },

  createOrder: async (courseId: string): Promise<CreateOrderResponse> =>
    paymentsApi.createOrderFor({ kind: 'course', id: courseId }),

  enrollFree: async (
    courseId: string
  ): Promise<{ ok: boolean; alreadyEnrolled: boolean }> =>
    paymentsApi.enrollFreeFor({ kind: 'course', id: courseId }),
};