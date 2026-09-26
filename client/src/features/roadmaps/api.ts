import { api } from '@/shared/lib/api';
import {
  paymentsApi,
  type CreateOrderResponse,
  type PaymentConfig,
} from '@/features/courses/api';

export type RoadmapBadge = 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';

export interface ApiRoadmapFeature {
  icon?: string;
  label: string;
}

export interface ApiRoadmapSellingPoint {
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface ApiRoadmapCurriculumModule {
  title: string;
  lessons: number;
  duration?: string;
  items: string[];
}

export interface ApiRoadmapInstructorLink {
  label: string;
  url: string;
}

export interface ApiRoadmapInstructor {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  links?: ApiRoadmapInstructorLink[];
}

export interface ApiRoadmapFaqItem {
  question: string;
  answer: string;
}

export interface ApiRoadmapProject {
  title: string;
  subtitle?: string;
  image?: string;
}

/**
 * Roadmap summary returned by the catalog endpoint.
 * Does not include the full display-field payload.
 */
export interface ApiRoadmapSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  tagline?: string;
  tags?: string[];
  badge?: RoadmapBadge;
  thumbnail?: string;
  isFree: boolean;
  price?: number;
  originalPrice?: number;
  courseCount: number;
  published: boolean;
}

/**
 * A course reference inside a roadmap, enriched with the summary
 * fields the client needs to render a course tile without a second
 * fetch.
 */
export interface ApiRoadmapCourseSummary {
  _id: string;
  courseId: string;
  order: number;
  isRequired: boolean;
  title: string;
  slug: string;
  description: string;
  language: string;
  thumbnail?: string;
  totalLessons: number;
}

/**
 * Full roadmap with enriched courses. Returned by the detail
 * endpoint.
 */
export interface ApiRoadmapDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  tagline?: string;
  tags?: string[];
  badge?: RoadmapBadge;
  thumbnail?: string;
  heroVideoUrl?: string;

  courses: {
    courseId: string;
    order: number;
    isRequired: boolean;
  }[];
  enrichedCourses: ApiRoadmapCourseSummary[];

  isFree: boolean;
  price?: number;
  originalPrice?: number;

  features?: ApiRoadmapFeature[];
  sellingPoints?: ApiRoadmapSellingPoint[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: ApiRoadmapCurriculumModule[];
  projects?: ApiRoadmapProject[];
  instructor?: ApiRoadmapInstructor;
  certificateIncluded?: boolean;
  faq?: ApiRoadmapFaqItem[];

  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const roadmapsApi = {
  /**
   * Public catalog. Only published roadmaps.
   */
  list: async (): Promise<ApiRoadmapSummary[]> => {
    const { data } = await api.get('/roadmaps');
    return data.data;
  },

  /**
   * Public detail. Returns the roadmap with enriched courses.
   */
  getBySlug: async (slug: string): Promise<ApiRoadmapDetail> => {
    const { data } = await api.get(`/roadmaps/${slug}`);
    return data.data;
  },

  /* ─── Payments ──────────────────────────────────────────────
     Roadmaps share the payment flow with courses. This wrapper
     delegates to the generic endpoint via the courses/api module so
     there is exactly one place that knows the endpoint path. */

  createOrder: async (roadmapId: string): Promise<CreateOrderResponse> =>
    paymentsApi.createOrderFor({ kind: 'roadmap', id: roadmapId }),

  enrollFree: async (
    roadmapId: string
  ): Promise<{ ok: boolean; alreadyEnrolled: boolean }> =>
    paymentsApi.enrollFreeFor({ kind: 'roadmap', id: roadmapId }),

  verify: paymentsApi.verify,

  config: async (): Promise<PaymentConfig> => paymentsApi.config(),
};