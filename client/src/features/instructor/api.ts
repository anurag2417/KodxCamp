import { api } from '@/shared/lib/api';
import type {
  ITutorialChallenge,
  IProjectTestRun,
  IProjectScreenshotSet,
} from '@kodxcamp/shared';

export type CourseTeamRole =
  | 'lead'
  | 'course_author'
  | 'problem_author'
  | 'class_coordinator'
  | 'ta'
  | 'viewer';

export interface ApiCourseTeamMember {
  _id?: string;
  userId: string;
  courseId?: string;
  role: CourseTeamRole;
  addedAt: string;
  addedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCoursePermissions {
  canEditContent: boolean;
  canManageCourse: boolean;
  canManageTeam: boolean;
  canViewStudents: boolean;
  canManageClasses: boolean;
}

export interface ApiInstructorCourse {
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
  createdAt: string;
}

export interface ApiLessonTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ApiInstructorWebLessonStep {
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
}

export interface ApiInstructorQuizQuestion {
  _id: string;
  prompt: string;
  options: { id: string; text: string }[];
  mode: 'single' | 'multiple';
  correctOptionIds: string[];
  explanation?: string;
  order: number;
  lessonId?: string;
}

export interface ApiInstructorLesson {
  _id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  contentType?: string;
  starterCode: string;
  starterFiles?: Record<string, string>;
  webChecks?: { requiredHtml: string[]; requiredCss: string[]; requiredJs: string[] };
  solution: string;
  problemSlug?: string;
  functionName: string;
  outputMode: 'return' | 'print';
  language: string;
  testCases: ApiLessonTestCase[];
  steps: ApiInstructorWebLessonStep[];
  /**
   * Tutorial challenges, using the shared shape. Typed as the real
   * type rather than `unknown[]` so the editor can read fields
   * without casts.
   */
  tutorialChallenges: ITutorialChallenge[];
}

export interface ApiInstructorModule {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
}

export interface ApiModuleLessonSummary {
  _id: string;
  title: string;
  slug: string;
  order: number;
  language: string;
  problemSlug?: string;
}

export interface ApiModulesResponse {
  modules: (ApiInstructorModule & { lessons: ApiModuleLessonSummary[] })[];
  ungrouped: ApiModuleLessonSummary[];
}

export interface ApiInstructorCourseFull extends ApiInstructorCourse {
  lessons: ApiInstructorLesson[];
  modules: ApiInstructorModule[];
  members: ApiCourseTeamMember[];
  myRole: 'admin' | CourseTeamRole | null;
  permissions: ApiCoursePermissions;
}

// ─── Cohorts ──────────────────────────────────────────────────────

export type CohortEntityKind = 'course' | 'roadmap';
export type CohortRole = 'instructor' | 'assistant' | 'student';

export interface ApiCohortSummary {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  entityKind: CohortEntityKind;
  entityId: string;
  entityTitle: string;
  entitySlug: string;
  startDate?: string;
  endDate?: string;
  archived: boolean;
  studentCount: number;
  instructorCount: number;
  createdAt: string;
}

export interface ApiCohortDetail {
  cohort: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    entityKind: CohortEntityKind;
    entityId: string;
    startDate?: string;
    endDate?: string;
    displayOrder: number;
    archived: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  entity: {
    kind: CohortEntityKind;
    _id: string;
    title: string;
    slug: string;
    description: string;
    language?: string;
    thumbnail?: string;
  };
  instructors: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  }[];
  assistants: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  }[];
  students: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    joinedAt: string;
  }[];
}

// ─── Invitations ─────────────────────────────────────────────────

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'revoked'
  | 'expired';

export interface ApiInvitation {
  _id: string;
  courseId: string;
  email: string;
  role: CourseTeamRole;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedInvitation {
  invitation: {
    _id: string;
    email: string;
    role: CourseTeamRole;
    status: InvitationStatus;
    expiresAt: string;
  };
  course: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    language: string;
    courseType?: string;
  };
  isExpired: boolean;
  isAlreadyAccepted: boolean;
  isRevoked: boolean;
}

// ─── Student roster ──────────────────────────────────────────────

export type RosterSort = 'recent' | 'progress' | 'name' | 'joined';

export interface ApiRosterRow {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  lastActiveAt: string;
  lessonsCompleted: number;
  totalLessons: number;
  percentage: number;
  problemsSolved: number;
  submissions: number;
  achievements: number;
}

export interface ApiRosterPage {
  students: ApiRosterRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiStudentDetail {
  student: {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    xp: number;
    streak: number;
    createdAt: string;
    lastActiveAt: string;
  };
  enrollment: { joinedAt: string; source: string } | null;
  progress: {
    percentage: number;
    completedLessons: number;
    totalLessons: number;
    lessons: {
      _id: string;
      title: string;
      slug: string;
      order: number;
      completed: boolean;
    }[];
  };
  recentActivity: {
    _id: string;
    type: string;
    xp: number;
    day: string;
    createdAt: string;
  }[];
  submissions: {
    _id: string;
    problemId: string;
    problemTitle: string;
    problemSlug: string;
    problemDifficulty: 'easy' | 'medium' | 'hard' | null;
    language: string;
    status: string;
    passedTests: number;
    totalTests: number;
    runtimeMs?: number;
    createdAt: string;
  }[];
  submissionsByDifficulty: { easy: number; medium: number; hard: number };
}

// ─── Project submissions + reviews ────────────────────────────────

export interface InstructorSubmissionDetail {
  _id: string;
  userId: string;
  projectId: string;
  attemptNumber: number;
  files: { name: string; language: string; content: string }[];
  status: string;
  submittedAt: string;
  notes?: string;
  testRun?: IProjectTestRun;
  screenshots?: IProjectScreenshotSet;
  createdAt: string;
  updatedAt: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export type InstructorReviewStatus =
  | 'passed'
  | 'needs_improvement'
  | 'resubmission_requested';

export interface InstructorSubmissionSummary {
  _id: string;
  userId: string;
  projectId: string;
  attemptNumber: number;
  status: string;
  submittedAt: string;
  testRun?: IProjectTestRun;
  screenshots?: IProjectScreenshotSet;
  createdAt: string;
  updatedAt: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  /**
   * The project this submission belongs to. Populated by the
   * pending-reviews endpoint, which needs it for the dashboard card.
   * Absent from the per-project listing, where it's redundant.
   */
  project?: {
    _id: string;
    title: string;
    slug: string;
  } | null;
  latestReview: {
    _id: string;
    instructorId: string;
    revisionNumber: number;
    finalScore: number;
    status: InstructorReviewStatus;
    requestResubmission: boolean;
    evaluationDate: string;
  } | null;
}

export interface InstructorCategoryOverride {
  category: string;
  score: number;
  note?: string;
}

export interface InstructorEvaluation {
  _id: string;
  submissionId: string;
  projectId: string;
  instructorId: string;
  revisionNumber: number;
  finalScore: number;
  categoryOverrides: InstructorCategoryOverride[];
  feedback: string;
  requestResubmission: boolean;
  status: InstructorReviewStatus;
  evaluationDate: string;
  createdAt: string;
  updatedAt: string;
  instructor?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

export interface CreateReviewInput {
  finalScore: number;
  categoryOverrides: InstructorCategoryOverride[];
  feedback: string;
  requestResubmission: boolean;
  status: InstructorReviewStatus;
}

/**
 * The AI evaluation shape, as returned by
 * `GET /instructor/submissions/:submissionId/evaluations`.
 *
 * This is the same payload the admin route returns. Declared locally
 * here so the instructor feature has no compile-time dependency on
 * the admin feature module.
 */
export interface InstructorAIEvaluation {
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

// ─── Instructor API ──────────────────────────────────────────────

export const instructorApi = {
  listMyCourses: async (): Promise<ApiInstructorCourse[]> => {
    const { data } = await api.get('/instructor/courses');
    return data.data;
  },

  getCourseFull: async (slug: string): Promise<ApiInstructorCourseFull> => {
    const { data } = await api.get(`/instructor/courses/${slug}`);
    return data.data;
  },

  createCourse: async (input: {
    title: string;
    slug: string;
    description: string;
    language: string;
    courseType?: string;
  }): Promise<ApiInstructorCourse> => {
    const { data } = await api.post('/instructor/courses', input);
    return data.data;
  },

  updateCourse: async (
    slug: string,
    patch: Partial<ApiInstructorCourse>
  ): Promise<ApiInstructorCourse> => {
    const { data } = await api.patch(`/instructor/courses/${slug}`, patch);
    return data.data;
  },

  setPublished: async (
    slug: string,
    published: boolean
  ): Promise<ApiInstructorCourse> => {
    const { data } = await api.patch(`/instructor/courses/${slug}/publish`, {
      published,
    });
    return data.data;
  },

  deleteCourse: async (slug: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/instructor/courses/${slug}`);
    return data.data;
  },

  /* ─── Modules ────────────────────────────────────────── */

  listModules: async (courseSlug: string): Promise<ApiModulesResponse> => {
    const { data } = await api.get(
      `/instructor/courses/${courseSlug}/modules`
    );
    return data.data;
  },

  createModule: async (
    courseSlug: string,
    input: { title: string; description?: string; order?: number }
  ): Promise<ApiInstructorModule> => {
    const { data } = await api.post(
      `/instructor/courses/${courseSlug}/modules`,
      input
    );
    return data.data;
  },

  updateModule: async (
    courseSlug: string,
    moduleId: string,
    patch: { title?: string; description?: string }
  ): Promise<ApiInstructorModule> => {
    const { data } = await api.patch(
      `/instructor/courses/${courseSlug}/modules/${moduleId}`,
      patch
    );
    return data.data;
  },

  deleteModule: async (
    courseSlug: string,
    moduleId: string
  ): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(
      `/instructor/courses/${courseSlug}/modules/${moduleId}`
    );
    return data.data;
  },

  reorderModule: async (
    courseSlug: string,
    moduleId: string,
    order: number
  ): Promise<ApiInstructorModule> => {
    const { data } = await api.patch(
      `/instructor/courses/${courseSlug}/modules/${moduleId}/order`,
      { order }
    );
    return data.data;
  },

  assignLessonToModule: async (
    courseSlug: string,
    moduleId: string,
    lessonId: string
  ): Promise<unknown> => {
    const { data } = await api.post(
      `/instructor/courses/${courseSlug}/modules/${moduleId}/lessons`,
      { lessonId }
    );
    return data.data;
  },

  unassignLesson: async (
    courseSlug: string,
    lessonId: string
  ): Promise<unknown> => {
    const { data } = await api.delete(
      `/instructor/courses/${courseSlug}/modules/lessons/${lessonId}`
    );
    return data.data;
  },

  /* ─── Lessons ────────────────────────────────────────── */

  createLesson: async (
    courseSlug: string,
    input: Record<string, unknown>
  ): Promise<unknown> => {
    const { data } = await api.post(
      `/instructor/courses/${courseSlug}/lessons`,
      input
    );
    return data.data;
  },

  updateLesson: async (
    courseSlug: string,
    lessonSlug: string,
    patch: Record<string, unknown>
  ): Promise<unknown> => {
    const { data } = await api.patch(
      `/instructor/courses/${courseSlug}/lessons/${lessonSlug}`,
      patch
    );
    return data.data;
  },

  deleteLesson: async (
    courseSlug: string,
    lessonSlug: string
  ): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(
      `/instructor/courses/${courseSlug}/lessons/${lessonSlug}`
    );
    return data.data;
  },

  /* ─── Cohorts ────────────────────────────────────────── */

  listMyCohorts: async (opts: {
    includeArchived?: boolean;
  } = {}): Promise<ApiCohortSummary[]> => {
    const { data } = await api.get('/instructor/cohorts', {
      params: opts.includeArchived ? { includeArchived: 'true' } : undefined,
    });
    return data.data;
  },

  getCohort: async (cohortId: string): Promise<ApiCohortDetail> => {
    const { data } = await api.get(`/instructor/cohorts/${cohortId}`);
    return data.data;
  },

  createCohort: async (input: {
    name: string;
    slug: string;
    description?: string;
    entityKind: CohortEntityKind;
    entityId: string;
    startDate?: string;
    endDate?: string;
    displayOrder?: number;
  }): Promise<ApiCohortDetail['cohort']> => {
    const { data } = await api.post('/instructor/cohorts', input);
    return data.data;
  },

  updateCohort: async (
    cohortId: string,
    patch: Partial<{
      name: string;
      slug: string;
      description: string;
      entityKind: CohortEntityKind;
      entityId: string;
      startDate: string;
      endDate: string;
      displayOrder: number;
      archived: boolean;
    }>
  ): Promise<ApiCohortDetail['cohort']> => {
    const { data } = await api.patch(`/instructor/cohorts/${cohortId}`, patch);
    return data.data;
  },

  setCohortArchived: async (
    cohortId: string,
    archived: boolean
  ): Promise<ApiCohortDetail['cohort']> => {
    const { data } = await api.patch(
      `/instructor/cohorts/${cohortId}/archive`,
      { archived }
    );
    return data.data;
  },

  deleteCohort: async (cohortId: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/instructor/cohorts/${cohortId}`);
    return data.data;
  },

  addCohortMember: async (
    cohortId: string,
    input: { userId: string; role: CohortRole }
  ): Promise<unknown> => {
    const { data } = await api.post(
      `/instructor/cohorts/${cohortId}/members`,
      input
    );
    return data.data;
  },

  updateCohortMemberRole: async (
    cohortId: string,
    userId: string,
    role: CohortRole
  ): Promise<unknown> => {
    const { data } = await api.patch(
      `/instructor/cohorts/${cohortId}/members/${userId}`,
      { role }
    );
    return data.data;
  },

  removeCohortMember: async (
    cohortId: string,
    userId: string
  ): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(
      `/instructor/cohorts/${cohortId}/members/${userId}`
    );
    return data.data;
  },

  /* ─── Project submissions + reviews ──────────────────── */

  listPendingReviews: async (): Promise<InstructorSubmissionSummary[]> => {
    const { data } = await api.get('/instructor/reviews/pending');
    return data.data;
  },

  listProjectSubmissions: async (
    projectSlug: string,
    filter: 'needs_review' | 'reviewed' | 'all' = 'all'
  ): Promise<InstructorSubmissionSummary[]> => {
    const { data } = await api.get(
      `/instructor/projects/${projectSlug}/submissions`,
      { params: { filter } }
    );
    return data.data;
  },

  getSubmission: async (
    submissionId: string
  ): Promise<InstructorSubmissionDetail> => {
    const { data } = await api.get(`/instructor/submissions/${submissionId}`);
    return data.data;
  },

  listEvaluations: async (
    submissionId: string
  ): Promise<InstructorAIEvaluation[]> => {
    const { data } = await api.get(
      `/instructor/submissions/${submissionId}/evaluations`
    );
    return data.data;
  },

  listReviews: async (
    submissionId: string
  ): Promise<InstructorEvaluation[]> => {
    const { data } = await api.get(
      `/instructor/submissions/${submissionId}/reviews`
    );
    return data.data;
  },

  createReview: async (
    submissionId: string,
    input: CreateReviewInput
  ): Promise<InstructorEvaluation> => {
    const { data } = await api.post(
      `/instructor/submissions/${submissionId}/reviews`,
      input
    );
    return data.data;
  },

  /* ─── Team ───────────────────────────────────────────── */

  listTeam: async (slug: string): Promise<ApiCourseTeamMember[]> => {
    const { data } = await api.get(`/instructor/courses/${slug}/team`);
    return data.data;
  },

  addTeamMember: async (
    slug: string,
    userId: string,
    role: CourseTeamRole
  ): Promise<ApiCourseTeamMember[]> => {
    const { data } = await api.post(
      `/instructor/courses/${slug}/team/${userId}`,
      { role }
    );
    return data.data;
  },

  updateTeamMember: async (
    slug: string,
    userId: string,
    role: CourseTeamRole
  ): Promise<ApiCourseTeamMember[]> => {
    const { data } = await api.patch(
      `/instructor/courses/${slug}/team/${userId}`,
      { role }
    );
    return data.data;
  },

  removeTeamMember: async (
    slug: string,
    userId: string
  ): Promise<ApiCourseTeamMember[]> => {
    const { data } = await api.delete(
      `/instructor/courses/${slug}/team/${userId}`
    );
    return data.data;
  },

  /* ─── Invitations ────────────────────────────────────── */

  listInvitations: async (slug: string): Promise<ApiInvitation[]> => {
    const { data } = await api.get(`/instructor/courses/${slug}/invitations`);
    return data.data;
  },

  createInvitation: async (
    slug: string,
    email: string,
    role: CourseTeamRole
  ): Promise<{ invitationId: string }> => {
    const { data } = await api.post(
      `/instructor/courses/${slug}/invitations`,
      { email, role }
    );
    return data.data;
  },

  revokeInvitation: async (
    slug: string,
    invitationId: string
  ): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(
      `/instructor/courses/${slug}/invitations/${invitationId}`
    );
    return data.data;
  },

  /* ─── Students ───────────────────────────────────────── */

  listStudents: async (
    slug: string,
    params: {
      search?: string;
      sort?: RosterSort;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiRosterPage> => {
    const { data } = await api.get(
      `/instructor/courses/${slug}/students`,
      { params }
    );
    return data.data;
  },

  getStudent: async (
    slug: string,
    userId: string
  ): Promise<ApiStudentDetail> => {
    const { data } = await api.get(
      `/instructor/courses/${slug}/students/${userId}`
    );
    return data.data;
  },

  /* ─── Quiz ───────────────────────────────────────────── */

  listQuiz: async (courseSlug: string): Promise<ApiInstructorQuizQuestion[]> => {
    const { data } = await api.get(`/instructor/courses/${courseSlug}/quiz`);
    return data.data;
  },

  createQuizQuestion: async (
    courseSlug: string,
    input: Omit<ApiInstructorQuizQuestion, '_id'>
  ): Promise<ApiInstructorQuizQuestion> => {
    const { data } = await api.post(`/instructor/courses/${courseSlug}/quiz`, input);
    return data.data;
  },

  deleteQuizQuestion: async (courseSlug: string, questionId: string) => {
    await api.delete(`/instructor/courses/${courseSlug}/quiz/${questionId}`);
  },
};

export const invitationApi = {
  resolve: async (token: string): Promise<ResolvedInvitation> => {
    const { data } = await api.get(`/invitations/${token}`);
    return data.data;
  },

  accept: async (token: string): Promise<{ courseSlug: string }> => {
    const { data } = await api.post(`/invitations/${token}/accept`);
    return data.data;
  },
};