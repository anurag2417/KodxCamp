import type {
  ICourseFeature,
  ICourseSellingPoint,
  ICourseCurriculumModule,
  ICourseInstructor,
  ICourseFaqItem,
  ICourseProject,
  CourseBadge,
} from './course.js';

/**
 * A single course inside a roadmap.
 *
 * Courses are *reused*, not copied. A roadmap references an existing
 * `Course` document by id. `order` controls display order within the
 * roadmap; `isRequired` distinguishes "must-complete" from "optional
 * track" (used later when computing roadmap completion percentage).
 *
 * This is a reference, not a snapshot. If the course changes, every
 * roadmap that contains it reflects the change — that's the point of
 * a reusable course entity.
 */
export interface IRoadmapCourse {
  courseId: string;
  order: number;
  isRequired: boolean;
}

/**
 * A roadmap is the top-level learning container.
 *
 * Roadmap > Course > Lesson. A student enrolls in a roadmap (or a
 * standalone course) and works through the courses in order.
 *
 * Roadmaps are independently priced and publishable. The display
 * fields mirror `Course` because a roadmap has its own landing page
 * with its own voice — the copy is not derived from its courses.
 */
export interface IRoadmap {
  _id: string;
  title: string;
  slug: string;
  description: string;

  /** Short subtitle rendered under the title in cards and heroes. */
  tagline?: string;

  /** Display tags, e.g. `['Full Stack', 'Career Track']`. */
  tags?: string[];

  /** Card badge, shared vocabulary with `Course`. */
  badge?: CourseBadge;

  /** Hero image URL. */
  thumbnail?: string;

  /** YouTube embed URL for the roadmap hero video. */
  heroVideoUrl?: string;

  /** Ordered list of courses in this roadmap. */
  courses: IRoadmapCourse[];

  /** Free / paid, same semantics as `Course`. */
  isFree: boolean;
  /** Price in INR paise. Undefined for free roadmaps. */
  price?: number;
  /** Strike-through "was" price in INR paise. */
  originalPrice?: number;

  /* ─── Display fields (all optional, additive) ──────────── */
  features?: ICourseFeature[];
  sellingPoints?: ICourseSellingPoint[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: ICourseCurriculumModule[];
  projects?: ICourseProject[];
  instructor?: ICourseInstructor;
  certificateIncluded?: boolean;
  faq?: ICourseFaqItem[];

  /** Draft / published. Only published roadmaps appear in the catalog. */
  published: boolean;

  /** User id of the admin who created this roadmap. */
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Roadmap summary for list endpoints. Carries only what the catalog
 * card needs — not the full display-field payload.
 */
export interface IRoadmapSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  tagline?: string;
  tags?: string[];
  badge?: CourseBadge;
  thumbnail?: string;
  isFree: boolean;
  price?: number;
  originalPrice?: number;
  courseCount: number;
  published: boolean;
}

/**
 * Full roadmap with enriched courses. `courses` is returned in order,
 * each one carrying the summary fields the workspace needs.
 */
export interface IRoadmapDetail extends IRoadmap {
  enrichedCourses: IRoadmapCourseSummary[];
}

/**
 * Enriched view of a course inside a roadmap.
 * Same shape as `IRoadmapCourse` plus the fields the client needs to
 * render the course tile without a second fetch.
 */
export interface IRoadmapCourseSummary {
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