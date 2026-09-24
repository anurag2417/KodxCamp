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
  problemSlug?: string;
}

export interface ApiLessonTestCase {
  index: number;
  input: string;
  expectedOutput: string;
  /** Display flag. Hide input/output from the student's test panel. */
  isHidden: boolean;
}

export interface ApiLessonFull {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  starterFiles?: Record<string, string>;
  problemSlug?: string;
  functionName: string;
  outputMode: 'return' | 'print';
  language: string;
  testCases: ApiLessonTestCase[];
}

export interface ApiQuizQuestion {
  _id: string;
  prompt: string;
  options: { id: string; text: string }[];
  order: number;
  lessonId?: string;
}

export interface ApiQuizResult {
  score: number;
  total: number;
  percentage: number;
  results: { questionId: string; correct: boolean; explanation?: string }[];
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

  getQuiz: async (courseSlug: string): Promise<ApiQuizQuestion[]> => {
    const { data } = await api.get(`/courses/${courseSlug}/quiz`);
    return data.data;
  },

  submitQuiz: async (
    courseSlug: string,
    answers: Record<string, string>
  ): Promise<ApiQuizResult> => {
    const { data } = await api.post(`/courses/${courseSlug}/quiz/submit`, { answers });
    return data.data;
  },
};