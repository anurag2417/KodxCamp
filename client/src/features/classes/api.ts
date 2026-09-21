import { api } from '@/shared/lib/api';

export type ClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface ApiChapter {
  title: string;
  startSec: number;
}

export interface ApiRecording {
  url: string;
  durationSec: number;
  sizeBytes: number;
  uploadedAt: string;
  chapters?: ApiChapter[];
}

export interface ApiClass {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructorId: string;
  instructorName: string;
  courseId?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: ClassStatus;
  meetLink: string;
  recording?: ApiRecording;
  enrolled?: boolean;
  enrollment?: ApiEnrollment | null;
}

export interface ApiEnrollment {
  _id: string;
  classId: string;
  userId: string;
  joinedAt: string;
  attendedAt?: string;
  watchedSeconds?: number;
  recordingCompletedAt?: string;
}

export interface ApiMyRecording {
  class: ApiClass;
  watchedSeconds: number;
  recordingCompletedAt: string | null;
  percentWatched: number;
}

export const classesApi = {
  list: async (scope: 'upcoming' | 'past' | 'all' = 'all'): Promise<ApiClass[]> => {
    const { data } = await api.get('/classes', { params: { scope } });
    return data.data;
  },

  getBySlug: async (
    slug: string
  ): Promise<{ class: ApiClass; enrollment: ApiEnrollment | null; attendeeCount: number }> => {
    const { data } = await api.get(`/classes/${slug}`);
    return data.data;
  },

  create: async (input: {
    title: string;
    description: string;
    scheduledAt: string;
    durationMinutes: number;
    meetLink?: string;
    courseId?: string;
  }): Promise<ApiClass> => {
    const { data } = await api.post('/classes', input);
    return data.data;
  },

  update: async (slug: string, patch: Partial<ApiClass>): Promise<ApiClass> => {
    const { data } = await api.patch(`/classes/${slug}`, patch);
    return data.data;
  },

  enroll: async (slug: string): Promise<ApiEnrollment> => {
    const { data } = await api.post(`/classes/${slug}/enroll`);
    return data.data;
  },

  unenroll: async (slug: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/classes/${slug}/enroll`);
    return data.data;
  },

  attend: async (slug: string): Promise<ApiEnrollment> => {
    const { data } = await api.post(`/classes/${slug}/attend`);
    return data.data;
  },

  watch: async (
    slug: string,
    watchedSeconds: number,
    durationSec: number
  ): Promise<ApiEnrollment> => {
    const { data } = await api.post(`/classes/${slug}/watch`, {
      watchedSeconds,
      durationSec,
    });
    return data.data;
  },

  myRecordings: async (): Promise<ApiMyRecording[]> => {
    const { data } = await api.get('/classes/mine/recordings');
    return data.data;
  },

  uploadRecording: async (
    slug: string,
    file: File,
    durationSec: number
  ): Promise<ApiClass> => {
    const form = new FormData();
    form.append('recording', file);
    form.append('durationSec', String(durationSec));
    const { data } = await api.post(`/classes/${slug}/recording`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};

