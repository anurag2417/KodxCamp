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
  /** INR paise. Undefined for free courses. */
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
  createdAt: string;
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
    userId: string
  ): Promise<{ ok: boolean; alreadyEnrolled: boolean }> => {
    const { data } = await api.post(`/admin/courses/${slug}/enroll`, {
      userId,
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