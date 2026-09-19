import { api } from './api';

export interface ApiCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  totalLessons: number;
  thumbnail?: string;
}

export interface ApiLessonSummary {
  _id: string;
  title: string;
  slug: string;
  order: number;
  language: string;
}

export interface ApiLessonFull {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  functionName: string;
  outputMode: 'return' | 'print';
  language: string;
  testCases: { input: string; expectedOutput: string }[];
}

export const coursesApi = {
  list: async (): Promise<ApiCourse[]> => {
    const { data } = await api.get('/courses');
    return data.data;
  },

  getBySlug: async (
    slug: string
  ): Promise<ApiCourse & { lessons: ApiLessonSummary[] }> => {
    const { data } = await api.get(`/courses/${slug}`);
    return data.data;
  },

  getLesson: async (
    courseSlug: string,
    lessonSlug: string
  ): Promise<{ course: ApiCourse; lesson: ApiLessonFull }> => {
    const { data } = await api.get(`/courses/${courseSlug}/lessons/${lessonSlug}`);
    return data.data;
  },
};