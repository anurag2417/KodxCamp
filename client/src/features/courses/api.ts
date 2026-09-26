import { api } from '@/shared/lib/api';
import type { ITutorialChallenge } from '@kodxcamp/shared';

export type CourseBadge = 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';

export interface ApiCourseFeature {
  icon?: string;
  label: string;
}

export interface ApiCourseSellingPoint {
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface ApiCourseCurriculumModule {
  title: string;
  lessons: number;
  duration?: string;
  items: string[];
}

export interface ApiCourseInstructorLink {
  label: string;
  url: string;
}

export interface ApiCourseInstructor {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  links?: ApiCourseInstructorLink[];
}

export interface ApiCourseFaqItem {
  question: string;
  answer: string;
}

export interface ApiCourseProject {
  title: string;
  subtitle?: string;
  image?: string;
}

export interface ApiCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  courseType?: string;
  totalLessons: number;
  thumbnail?: string;
  price?: number;
  originalPrice?: number;
  isFree: boolean;

  tagline?: string;
  tags?: string[];
  badge?: CourseBadge;
  heroVideoUrl?: string;
  features?: ApiCourseFeature[];
  sellingPoints?: ApiCourseSellingPoint[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: ApiCourseCurriculumModule[];
  projects?: ApiCourseProject[];
  instructor?: ApiCourseInstructor;
  certificateIncluded?: boolean;
  faq?: ApiCourseFaqItem[];
}

export interface ApiLessonSummary {
  _id: string;
  title: string;
  slug: string;
  order: number;
  language: string;
  problemSlug?: string;
  moduleId?: string;
}

export interface ApiLessonTestCase {
  index: number;
  input: string;
  expectedOutput: string;
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
  moduleId?: string;
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
  steps: ApiWebLessonStep[];
  /** FreeCodeCamp-style guided exercises. Empty when the lesson has none. */
  tutorialChallenges: ITutorialChallenge[];
}

export interface ApiCourseModule {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
}

export interface ApiCourseWithLessons extends ApiCourse {
  lessons: ApiLessonSummary[];
  modules: ApiCourseModule[];
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

  getBySlug: async (slug: string): Promise<ApiCourseWithLessons> => {
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

  getQuiz: async (
    courseSlug: string,
    lessonSlug: string
  ): Promise<ApiQuizQuestion[]> => {
    const { data } = await api.get(
      `/courses/${courseSlug}/lessons/${lessonSlug}/quiz`
    );
    return data.data;
  },

  submitQuiz: async (
    courseSlug: string,
    lessonSlug: string,
    answers: Record<string, string | string[]>
  ): Promise<ApiQuizResult> => {
    const { data } = await api.post(
      `/courses/${courseSlug}/lessons/${lessonSlug}/quiz/submit`,
      { answers }
    );
    return data.data;
  },
};

/* ─── Payments ───────────────────────────────────────────────────── */

export interface PaymentConfig {
  configured: boolean;
  mode: 'test' | 'live';
  keyId?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  title: string;
}

export interface PaymentEntityRef {
  kind: 'course' | 'roadmap';
  id: string;
}

export const paymentsApi = {
  config: async (): Promise<PaymentConfig> => {
    const { data } = await api.get('/payments/config');
    return data.data;
  },

  createOrderFor: async (
    ref: PaymentEntityRef
  ): Promise<CreateOrderResponse> => {
    const { data } = await api.post('/payments/create-order', ref);
    return data.data;
  },

  verify: async (input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<{ ok: boolean }> => {
    const { data } = await api.post('/payments/verify', input);
    return data.data;
  },

  enrollFreeFor: async (
    ref: PaymentEntityRef
  ): Promise<{ ok: boolean; alreadyEnrolled: boolean }> => {
    const { data } = await api.post('/payments/enroll-free', ref);
    return data.data;
  },

  // CHANGED: new method — ask the server whether the caller is
  // enrolled in the given entity. Replaces the
  // `progressApi.getForCourse` heuristic, which always succeeded and
  // therefore always reported "enrolled".
  enrollmentStatus: async (
    ref: PaymentEntityRef
  ): Promise<{ enrolled: boolean }> => {
    const { data } = await api.get('/payments/enrollment-status', {
      params: ref,
    });
    return data.data;
  },

  createOrder: async (courseId: string): Promise<CreateOrderResponse> =>
    paymentsApi.createOrderFor({ kind: 'course', id: courseId }),

  enrollFree: async (
    courseId: string
  ): Promise<{ ok: boolean; alreadyEnrolled: boolean }> =>
    paymentsApi.enrollFreeFor({ kind: 'course', id: courseId }),
};