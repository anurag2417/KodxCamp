import { api } from '@/shared/lib/api';

export type CourseTeamRole = 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer';

export interface ApiCourseTeamMember {
  userId: string;
  role: CourseTeamRole;
  addedAt: string;
  addedBy: string;
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
  thumbnail?: string;
  totalLessons: number;
  createdBy: string;
  members: ApiCourseTeamMember[];
  published: boolean;
  createdAt: string;
}

export interface ApiInstructorCourseFull extends ApiInstructorCourse {
  lessons: Array<{
    _id: string;
    courseId: string;
    title: string;
    slug: string;
    order: number;
    content: string;
    starterCode: string;
    solution: string;
    functionName: string;
    outputMode: 'return' | 'print';
    language: string;
    testCases: { input: string; expectedOutput: string }[];
  }>;
  myRole: 'admin' | CourseTeamRole | null;
  permissions: ApiCoursePermissions;
}

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

  // Lessons
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

  // Team
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
};

