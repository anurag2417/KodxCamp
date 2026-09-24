import { api } from '@/shared/lib/api';

export interface ApiCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  courseType?: string;
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

export interface ApiWebLessonStep {
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

export interface ApiLessonFull {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  contentType?: string;
  starterCode: string;
  starterFiles?: Record<string, string>;
  webChecks?: {
    requiredHtml: string[];
    requiredCss: string[];
    requiredJs: string[];
  };
  problemSlug?: string;
  functionName: string;
  outputMode: 'return' | 'print';
  language: string;
  testCases: ApiLessonTestCase[];
  /** Step-by-step mode. Empty array means classic single-shot. */
  steps: ApiWebLessonStep[];
}

/**
 * The course payload returned alongside a lesson includes the sibling
 * lesson summaries so the sidebar can render without a second request.
 */
export interface ApiCourseWithLessons extends ApiCourse {
  lessons: ApiLessonSummary[];
}

export interface ApiQuizQuestion {
  _id: string;
  prompt: string;
  options: { id: string; text: string }[];
  mode: 'single' | 'multiple';
  order: number;
  lessonId?: string;
}

export interface ApiQuizResult {
  score: number;
  total: number;
  percentage: number;
  results: {
    questionId: string;
    correct: boolean;
    correctOptionIds?: string[];
    explanation?: string;
  }[];
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
  ): Promise<{ course: ApiCourseWithLessons; lesson: ApiLessonFull }> => {
    const { data } = await api.get(
      `/courses/${courseSlug}/lessons/${lessonSlug}`
    );
    return data.data;
  },

  getQuiz: async (courseSlug: string, lessonSlug: string): Promise<ApiQuizQuestion[]> => {
    const { data } = await api.get(`/courses/${courseSlug}/lessons/${lessonSlug}/quiz`);
    return data.data;
  },

  submitQuiz: async (
    courseSlug: string,
    lessonSlug: string,
    answers: Record<string, string | string[]>
  ): Promise<ApiQuizResult> => {
    const { data } = await api.post(`/courses/${courseSlug}/lessons/${lessonSlug}/quiz/submit`, { answers });
    return data.data;
  },
};