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

export interface ApiLessonTestCase {
  input: string;
  expectedOutput: string;
  /** Display flag. Hides input/output from the student's test panel. */
  isHidden: boolean;
}

export interface ApiInstructorLesson {
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
  testCases: ApiLessonTestCase[];
}

export interface ApiInstructorCourseFull extends ApiInstructorCourse {
  lessons: ApiInstructorLesson[];
  myRole: 'admin' | CourseTeamRole | null;
  permissions: ApiCoursePermissions;
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
  };
  isExpired: boolean;
  isAlreadyAccepted: boolean;
  isRevoked: boolean;
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

  // ─── Lessons ───────────────────────────────────────────────
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

  // ─── Team (by user id) ────────────────────────────────────
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

  // ─── Invitations ──────────────────────────────────────────
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
};

// ─── Invitation API (public + authenticated accept) ──────────────

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