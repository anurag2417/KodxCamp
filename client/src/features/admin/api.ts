import { api } from '@/shared/lib/api';

// ─── Shared test case type ────────────────────────────────────────

export interface EditableTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

// ─── Stats ────────────────────────────────────────────────────────

export interface AdminStats {
  users: {
    total: number;
    instructors: number;
    admins: number;
    newLast7d: number;
  };
  content: {
    courses: number;
    lessons: number;
    problems: number;
    projects: number;
    classesScheduled: number;
    classesEnded: number;
  };
  engagement: {
    submissions: number;
    submissionsAccepted: number;
    acceptanceRate: number;
    userProjects: number;
    enrollments: number;
    activitiesLast7d: number;
  };
  dailyActivity: { day: string; count: number }[];
}

// ─── Users ────────────────────────────────────────────────────────

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  xp: number;
  streak: number;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminInstructor {
  _id: string;
  name: string;
  email: string;
  role: 'instructor' | 'admin';
  avatar?: string;
}

// ─── Courses ──────────────────────────────────────────────────────

export interface AdminCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  courseType?: string;
  thumbnail?: string;
  totalLessons: number;
  createdBy: string;
  published: boolean;
  price?: number;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLesson {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  starterFiles?: Record<string, string>;
  webChecks?: {
    requiredHtml: string[];
    requiredCss: string[];
    requiredJs: string[];
  };
  solution: string;
  problemSlug?: string;
  functionName: string;
  outputMode: 'return' | 'print';
  language: string;
  testCases: EditableTestCase[];
  steps: {
    title: string;
    instructions: string;
    hint?: string;
    starterFiles: {
      'index.html': string;
      'styles.css': string;
      'script.js': string;
    };
    webChecks: {
      requiredHtml: string[];
      requiredCss: string[];
      requiredJs: string[];
    };
  }[];
}

export interface AdminEnrollment {
  _id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  source: 'manual' | 'paid' | 'invited';
  cohortId?: string;
}

// ─── Roadmaps ─────────────────────────────────────────────────────

export type AdminRoadmapBadge =
  | 'LIVE'
  | 'NEW'
  | 'POPULAR'
  | 'STARTING SOON';

export interface AdminRoadmapCourseInput {
  courseId: string;
  order: number;
  isRequired: boolean;
}

export interface AdminRoadmapSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  tagline?: string;
  tags?: string[];
  badge?: AdminRoadmapBadge;
  thumbnail?: string;
  isFree: boolean;
  price?: number;
  originalPrice?: number;
  courseCount: number;
  published: boolean;
  updatedAt?: string;
}

export interface AdminRoadmapDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  tagline?: string;
  tags?: string[];
  badge?: AdminRoadmapBadge;
  thumbnail?: string;
  heroVideoUrl?: string;

  courses: AdminRoadmapCourseInput[];
  enrichedCourses: {
    _id: string;
    courseId: string;
    order: number;
    isRequired: boolean;
    title: string;
    slug: string;
    description: string;
    language: string;
    thumbnail?: string;
    totalLessons: number;
  }[];

  isFree: boolean;
  price?: number;
  originalPrice?: number;

  features?: unknown[];
  sellingPoints?: unknown[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: unknown[];
  projects?: unknown[];
  instructor?: unknown;
  certificateIncluded?: boolean;
  faq?: unknown[];

  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Problems ─────────────────────────────────────────────────────

export interface AdminProblem {
  _id: string;
  problemId: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: 'return' | 'print';
  starterCode: Record<string, string>;
  testCases: EditableTestCase[];
  sqlSetup?: string;
  scope: 'global' | 'course';
  courseId?: string;
  tier: 'starter' | 'interview';
  createdAt: string;
}

// ─── Projects ─────────────────────────────────────────────────────

export type AdminProjectMode = 'required' | 'recommended' | 'open_choice';

export interface AdminProjectRubricCategory {
  category: string;
  weight: number;
}

export interface AdminProjectSpecification {
  objective?: string;
  requiredFeatures?: string[];
  technicalRequirements?: string[];
  designRequirements?: string[];
  accessibilityRequirements?: string[];
  expectedBehaviour?: string;
}

export type AdminProjectTestType =
  | 'dom-exists'
  | 'dom-text'
  | 'dom-attribute'
  | 'dom-count'
  | 'event-click'
  | 'event-input'
  | 'visual-nonblank';

export interface AdminDomAssertion {
  type: 'dom-exists' | 'dom-text' | 'dom-attribute' | 'dom-count';
  selector: string;
  mode?: 'equals' | 'matches';
  value?: string;
  attribute?: string;
  count?: number;
}

export interface AdminProjectTest {
  name: string;
  check: {
    type: AdminProjectTestType;
    selector?: string;
    mode?: 'equals' | 'matches';
    value?: string;
    attribute?: string;
    count?: number;
    assert?: AdminDomAssertion;
    minimumChars?: number;
  };
  description?: string;
}

export interface AdminProject {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  difficulty: string;
  topics: string[];
  files: {
    name: string;
    language: string;
    content: string;
    isEntry?: boolean;
  }[];
  previewMode: 'html' | 'react' | 'sql' | 'none';
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;
  mode: AdminProjectMode;
  specification: AdminProjectSpecification;
  rubric: AdminProjectRubricCategory[];
  tests: AdminProjectTest[];
  createdAt: string;
}

// ─── Project submissions + AI evaluation ──────────────────────────

/**
 * A summary row for one project submission, as returned by
 * `GET /admin/projects/:slug/submissions`.
 *
 * Deliberately light: it carries what the list view needs (student,
 * attempt number, test summary, latest AI scores) without the full
 * submission files or screenshots. Those are fetched per-submission
 * by `AdminSubmissionEvaluation`.
 */
export interface AdminSubmissionSummary {
  _id: string;
  attemptNumber: number;
  status: string;
  submittedAt: string;
  testRunSummary: {
    totalTests: number;
    passedTests: number;
    allPassed: boolean;
  } | null;
  hasScreenshots: boolean;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  latestEvaluations: {
    code: { score: number | null; evaluationDate: string } | null;
    vision: { score: number | null; evaluationDate: string } | null;
  };
}

/**
 * A single submission in full, as returned by
 * `GET /admin/projects/submissions/:submissionId`.
 *
 * The `student` field is attached by the server from the User
 * document, so it is never undefined. `testRun` and `screenshots` are
 * their real shapes rather than `unknown`, so consumers can read them
 * without casts.
 */
export interface AdminSubmissionDetail {
  _id: string;
  userId: string;
  projectId: string;
  attemptNumber: number;
  files: { name: string; language: string; content: string }[];
  status: string;
  submittedAt: string;
  notes?: string;
  testRun?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    allPassed: boolean;
    durationMs: number;
    ranAt: string;
    error?: string;
    results?: {
      name: string;
      passed: boolean;
      actual: string;
      message?: string;
    }[];
  };
  screenshots?: {
    desktop?: {
      viewport: 'desktop' | 'mobile';
      width: number;
      height: number;
      dataUrl: string;
    };
    mobile?: {
      viewport: 'desktop' | 'mobile';
      width: number;
      height: number;
      dataUrl: string;
    };
    error?: string;
  };
  createdAt: string;
  updatedAt: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

/**
 * One evaluation row, as returned by
 * `GET /admin/projects/submissions/:submissionId/evaluations`.
 *
 * `parsed` is the model's structured output when parsing succeeded.
 * `parseError` is set when it didn't — the raw text is preserved in
 * `rawResponse` regardless.
 */
export interface AdminAIEvaluation {
  _id: string;
  submissionId: string;
  projectId: string;
  userId: string;
  kind: 'code' | 'vision';

  evaluatorVersion: string;
  promptVersion: string;
  provider: string;
  modelId: string;
  usedImages: boolean;
  evaluationDate: string;

  projectVersion: string | null;

  rawResponse: string;
  parseError?: string;
  parsed?: {
    score?: number | null;
    categoryScores?: {
      category: string;
      score: number;
      max: number;
      notes: string;
    }[];
    requirementResults?: {
      requirement: string;
      met: boolean;
      evidence: string;
    }[];
    overallFeedback?: string;
    evaluatorNotConfigured?: boolean;
  };

  evaluatedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuration status of the AI subsystem. The admin UI uses this
 * to render the "Evaluate" button honestly — disabled with a clear
 * reason rather than a failed call.
 */
export interface AdminAIStatus {
  textConfigured: boolean;
  visionConfigured: boolean;
}

// ─── Classes ──────────────────────────────────────────────────────

export interface AdminClass {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructorId: string;
  instructorName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetLink: string;
}

// ─── Bulk import ──────────────────────────────────────────────────

export type BulkKind = 'problems' | 'projects' | 'courses';
export type BulkMode = 'merge' | 'replace';

export interface BulkImportReport {
  created: number;
  updated: number;
  skipped: number;
  failed: { index: number; slug?: string; error: string }[];
  totalProcessed: number;
}

// ─── API ──────────────────────────────────────────────────────────

export const adminApi = {
  // ─── Stats + users ────────────────────────────────────────
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get('/admin/stats');
    return data.data;
  },

  listUsers: async (
    params: {
      search?: string;
      role?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<AdminUsersResponse> => {
    const { data } = await api.get('/admin/users', { params });
    return data.data;
  },

  listInstructors: async (): Promise<AdminInstructor[]> => {
    const { data } = await api.get('/admin/instructors');
    return data.data;
  },

  setUserRole: async (
    userId: string,
    role: 'student' | 'instructor' | 'admin'
  ): Promise<AdminUser> => {
    const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
    return data.data;
  },

  deleteUser: async (userId: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data.data;
  },

  // ─── Courses ──────────────────────────────────────────────
  listCourses: async (): Promise<AdminCourse[]> => {
    const { data } = await api.get('/admin/courses');
    return data.data;
  },

  createCourse: async (input: {
    title: string;
    slug: string;
    description: string;
    language: string;
    courseType?: string;
    thumbnail?: string;
    published?: boolean;
  }): Promise<AdminCourse> => {
    const { data } = await api.post('/admin/courses', input);
    return data.data;
  },

  getCourseFull: async (
    slug: string
  ): Promise<AdminCourse & { lessons: AdminLesson[] }> => {
    const { data } = await api.get(`/admin/courses/${slug}`);
    return data.data;
  },

  updateCourse: async (
    slug: string,
    patch: Partial<AdminCourse>
  ): Promise<AdminCourse> => {
    const { data } = await api.patch(`/admin/courses/${slug}`, patch);
    return data.data;
  },

  deleteCourse: async (slug: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/admin/courses/${slug}`);
    return data.data;
  },

  // ─── Course pricing + enrollment ──────────────────────────
  setCoursePricing: async (
    slug: string,
    input: { isFree: boolean; price?: number }
  ): Promise<AdminCourse> => {
    const { data } = await api.patch(`/admin/courses/${slug}/pricing`, input);
    return data.data;
  },

  listCourseEnrollments: async (slug: string): Promise<AdminEnrollment[]> => {
    const { data } = await api.get(`/admin/courses/${slug}/enrollments`);
    return data.data;
  },

  enrollUser: async (
    slug: string,
    userId: string,
    cohortId?: string
  ): Promise<{ ok: boolean; alreadyEnrolled: boolean }> => {
    const { data } = await api.post(`/admin/courses/${slug}/enroll`, {
      userId,
      cohortId,
    });
    return data.data;
  },

  revokeEnrollment: async (
    slug: string,
    userId: string
  ): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(
      `/admin/courses/${slug}/enrollments/${userId}`
    );
    return data.data;
  },

  // ─── Roadmaps ─────────────────────────────────────────────
  listRoadmaps: async (): Promise<AdminRoadmapSummary[]> => {
    const { data } = await api.get('/admin/roadmaps');
    return data.data;
  },

  getRoadmapFull: async (slug: string): Promise<AdminRoadmapDetail> => {
    const { data } = await api.get(`/admin/roadmaps/${slug}`);
    return data.data;
  },

  createRoadmap: async (input: {
    title: string;
    slug: string;
    description: string;
    tagline?: string;
    courses?: AdminRoadmapCourseInput[];
    isFree?: boolean;
    price?: number;
    published?: boolean;
  }): Promise<AdminRoadmapDetail> => {
    const { data } = await api.post('/admin/roadmaps', input);
    return data.data;
  },

  updateRoadmap: async (
    slug: string,
    patch: Record<string, unknown>
  ): Promise<AdminRoadmapDetail> => {
    const { data } = await api.patch(`/admin/roadmaps/${slug}`, patch);
    return data.data;
  },

  setRoadmapPublished: async (
    slug: string,
    published: boolean
  ): Promise<AdminRoadmapDetail> => {
    const { data } = await api.patch(`/admin/roadmaps/${slug}/publish`, {
      published,
    });
    return data.data;
  },

  deleteRoadmap: async (slug: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/admin/roadmaps/${slug}`);
    return data.data;
  },

  // ─── Problems ─────────────────────────────────────────────
  createProblem: async (
    input: Partial<AdminProblem>
  ): Promise<AdminProblem> => {
    const { data } = await api.post('/admin/problems', input);
    return data.data;
  },

  getProblemFull: async (slug: string): Promise<AdminProblem> => {
    const { data } = await api.get(`/admin/problems/${slug}`);
    return data.data;
  },

  updateProblem: async (
    slug: string,
    patch: Partial<AdminProblem>
  ): Promise<AdminProblem> => {
    const { data } = await api.patch(`/admin/problems/${slug}`, patch);
    return data.data;
  },

  deleteProblem: async (slug: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/admin/problems/${slug}`);
    return data.data;
  },

  // ─── Projects ─────────────────────────────────────────────
  createProject: async (
    input: Partial<AdminProject>
  ): Promise<AdminProject> => {
    const { data } = await api.post('/admin/projects', input);
    return data.data;
  },

  getProjectFull: async (slug: string): Promise<AdminProject> => {
    const { data } = await api.get(`/admin/projects/${slug}`);
    return data.data;
  },

  updateProject: async (
    slug: string,
    patch: Partial<AdminProject>
  ): Promise<AdminProject> => {
    const { data } = await api.patch(`/admin/projects/${slug}`, patch);
    return data.data;
  },

  deleteProject: async (slug: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/admin/projects/${slug}`);
    return data.data;
  },

  // ─── Project submissions + AI evaluation ──────────────────
  listProjectSubmissions: async (
    slug: string
  ): Promise<AdminSubmissionSummary[]> => {
    const { data } = await api.get(`/admin/projects/${slug}/submissions`);
    return data.data;
  },

  /**
   * Read a single submission, owner-agnostic. Admin-only on the
   * server. The `student` field is attached server-side, and
   * `testRun` / `screenshots` come back in their real shapes — see
   * `AdminSubmissionDetail`.
   */
  getAdminSubmission: async (
    submissionId: string
  ): Promise<AdminSubmissionDetail> => {
    const { data } = await api.get(
      `/admin/projects/submissions/${submissionId}`
    );
    return data.data;
  },

  listEvaluations: async (
    submissionId: string,
    kind?: 'code' | 'vision'
  ): Promise<AdminAIEvaluation[]> => {
    const { data } = await api.get(
      `/admin/projects/submissions/${submissionId}/evaluations`,
      { params: kind ? { kind } : undefined }
    );
    return data.data;
  },

  evaluateSubmission: async (
    submissionId: string
  ): Promise<{ evaluations: AdminAIEvaluation[] }> => {
    const { data } = await api.post(
      `/admin/projects/submissions/${submissionId}/evaluate`
    );
    return data.data;
  },

  getAIStatus: async (): Promise<AdminAIStatus> => {
    const { data } = await api.get('/admin/ai/status');
    return data.data;
  },

  // ─── Classes ──────────────────────────────────────────────
  listClasses: async (): Promise<AdminClass[]> => {
    const { data } = await api.get('/admin/classes');
    return data.data;
  },

  createClass: async (input: {
    title: string;
    description: string;
    scheduledAt: string;
    durationMinutes: number;
    meetLink: string;
    courseId?: string;
  }): Promise<AdminClass> => {
    const { data } = await api.post('/classes', input);
    return data.data;
  },

  updateClass: async (
    slug: string,
    patch: Partial<AdminClass>
  ): Promise<AdminClass> => {
    const { data } = await api.patch(`/admin/classes/${slug}`, patch);
    return data.data;
  },

  deleteClass: async (slug: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/admin/classes/${slug}`);
    return data.data;
  },

  // ─── Bulk import ──────────────────────────────────────────
  bulkImport: async (input: {
    kind: BulkKind;
    mode: BulkMode;
    dryRun: boolean;
    items: unknown;
  }): Promise<BulkImportReport> => {
    const { data } = await api.post('/admin/bulk/import', input);
    return data.data;
  },
};