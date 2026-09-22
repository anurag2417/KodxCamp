import { api } from '@/shared/lib/api';

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

export interface ApiLessonTestCase {
  index: number;
  input: string;
  expectedOutput: string;
}

export interface ApiLessonHiddenTestCase {
  id: string;
  input: string;
  expectedOutputHash: string;
  canonicalization: 'trim-trailing-newline' | 'trim-all' | 'exact';
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
  testCases: ApiLessonTestCase[];
  hiddenTestCases: ApiLessonHiddenTestCase[];
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
    const { data } = await api.get(
      `/courses/${courseSlug}/lessons/${lessonSlug}`
    );
    return data.data;
  },
};