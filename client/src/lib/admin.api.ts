import { api } from './api';

// ─── Types ───────────────────────────────────────
export interface AdminStats {
  users: { total: number; instructors: number; admins: number; newLast7d: number };
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

export interface AdminCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  thumbnail?: string;
  totalLessons: number;
  createdAt: string;
}

export interface AdminLesson {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  solution: string;
  language: string;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
}

export interface AdminProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  statement: string;
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  createdAt: string;
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
  files: { name: string; language: string; content: string; isEntry?: boolean }[];
  previewMode: 'html' | 'react' | 'sql' | 'none';
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;
  createdAt: string;
}

export interface AdminClass {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructorName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetLink: string;
}

// ─── API ─────────────────────────────────────────
export const adminApi = {
  // Stats
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get('/admin/stats');
    return data.data;
  },

  // Users
  listUsers: async (params: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<AdminUsersResponse> => {
    const { data } = await api.get('/admin/users', { params });
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

  // Courses
  createCourse: async (input: {
    title: string;
    slug: string;
    description: string;
    language: string;
    thumbnail?: string;
  }): Promise<AdminCourse> => {
    const { data } = await api.post('/admin/courses', input);
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

  // Lessons
  createLesson: async (
    courseSlug: string,
    input: Partial<AdminLesson>
  ): Promise<AdminLesson> => {
    const { data } = await api.post(`/admin/courses/${courseSlug}/lessons`, input);
    return data.data;
  },

  updateLesson: async (
    courseSlug: string,
    lessonSlug: string,
    patch: Partial<AdminLesson>
  ): Promise<AdminLesson> => {
    const { data } = await api.patch(
      `/admin/courses/${courseSlug}/lessons/${lessonSlug}`,
      patch
    );
    return data.data;
  },

  deleteLesson: async (
    courseSlug: string,
    lessonSlug: string
  ): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(
      `/admin/courses/${courseSlug}/lessons/${lessonSlug}`
    );
    return data.data;
  },

  // Problems
  createProblem: async (input: Partial<AdminProblem>): Promise<AdminProblem> => {
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

  // Projects
  createProject: async (input: Partial<AdminProject>): Promise<AdminProject> => {
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

  // Classes
  listClasses: async (): Promise<AdminClass[]> => {
    const { data } = await api.get('/admin/classes');
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
};