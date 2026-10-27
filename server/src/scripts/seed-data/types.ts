/**
 * Seed data types.
 *
 * These are the shapes the individual seed-data/*.ts files export.
 * They do NOT correspond 1:1 to the Mongo models — the runner maps
 * them into the model shapes at write time. This keeps the seed data
 * readable (no ObjectId strings, no createdAt noise) and lets the
 * runner own the mapping.
 */

import type {
  GlobalPermission,
  UserRole,
} from '../../models/User.model.js';

/* ─── Accounts ──────────────────────────────────────────────────── */

export interface SeedAccount {
  /** Key used for cross-references inside the seed (e.g. 'instructor'). */
  key: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions?: GlobalPermission[];
  /** Marks accounts whose progress will be seeded. */
  withProgress?: boolean;
}

/* ─── Courses & lessons ─────────────────────────────────────────── */

export interface SeedTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface SeedWebChecks {
  requiredHtml: string[];
  requiredCss: string[];
  requiredJs: string[];
}

export interface SeedWebLessonStep {
  title: string;
  instructions: string;
  hint?: string;
  starterFiles: Partial<{
    'index.html': string;
    'styles.css': string;
    'script.js': string;
  }>;
  webChecks: SeedWebChecks;
}

export interface SeedTutorialChallenge {
  title: string;
  instructions: string;
  hint?: string;
  starterCode: string;
  checks: Array<
    | { type: 'includes'; value: string; label?: string }
    | {
        type: 'dom';
        selector: string;
        expect: 'exists' | 'textEquals' | 'textMatches';
        value?: string;
        label?: string;
      }
  >;
  language: string;
}

export interface SeedLesson {
  title: string;
  slug: string;
  content: string;
  contentType?: string;
  starterCode: string;
  solution: string;
  starterFiles?: Record<string, string>;
  webChecks?: SeedWebChecks;
  testCases?: SeedTestCase[];
  steps?: SeedWebLessonStep[];
  tutorialChallenges?: SeedTutorialChallenge[];
  /** Slug of a problem this lesson links to, if any. */
  problemSlug?: string;
  /** For code lessons: the function name the runner will call. */
  functionName?: string;
  /** For code lessons: 'return' or 'print'. */
  outputMode?: 'return' | 'print';
}

export interface SeedCourseModule {
  title: string;
  description?: string;
  /** Slugs of the lessons in this module, in order. */
  lessonSlugs: string[];
}

export interface SeedCourse {
  thumbnail?: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  courseType?: string;
  published: boolean;

  /** Display fields — optional, the CourseDetail page renders conditionally. */
  tagline?: string;
  tags?: string[];
  badge?: 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';
  heroVideoUrl?: string;
  features?: { icon?: string; label: string }[];
  sellingPoints?: { icon?: string; title: string; subtitle?: string }[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: {
    title: string;
    lessons: number;
    duration?: string;
    items: string[];
  }[];
  projects?: { title: string; subtitle?: string; image?: string }[];
  instructor?: {
    name: string;
    role?: string;
    bio?: string;
    avatar?: string;
    links?: { label: string; url: string }[];
  };
  certificateIncluded?: boolean;
  faq?: { question: string; answer: string }[];

  /**
   * Whether the course is free. Defaults to `true` when omitted —
   * matches the Course model's default.
   */
  isFree?: boolean;

  /** Pricing — omit for free. */
  price?: number;
  originalPrice?: number;

  lessons: SeedLesson[];
  modules?: SeedCourseModule[];
}

/* ─── Roadmaps ──────────────────────────────────────────────────── */

export interface SeedRoadmapCourseRef {
  /** Course slug from courses.ts. */
  courseSlug: string;
  order: number;
  isRequired: boolean;
}

export interface SeedRoadmap {
  title: string;
  slug: string;
  description: string;
  tagline?: string;
  tags?: string[];
  badge?: 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';
  heroVideoUrl?: string;
  features?: { icon?: string; label: string }[];
  sellingPoints?: { icon?: string; title: string; subtitle?: string }[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: {
    title: string;
    lessons: number;
    duration?: string;
    items: string[];
  }[];
  projects?: { title: string; subtitle?: string; image?: string }[];
  instructor?: {
    name: string;
    role?: string;
    bio?: string;
    avatar?: string;
    links?: { label: string; url: string }[];
  };
  certificateIncluded?: boolean;
  faq?: { question: string; answer: string }[];
  courses: SeedRoadmapCourseRef[];
  isFree: boolean;
  price?: number;
  originalPrice?: number;
  published: boolean;
}

/* ─── Problems ──────────────────────────────────────────────────── */

export interface SeedProblem {
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: 'return' | 'print';
  starterCode: Record<string, string>;
  testCases: SeedTestCase[];
  sqlSetup?: string;
  /** 'starter' or 'interview'. Defaults to 'starter'. */
  tier?: 'starter' | 'interview';
}

/* ─── Projects ──────────────────────────────────────────────────── */

export interface SeedProjectFile {
  name: string;
  language: 'html' | 'css' | 'javascript' | 'jsx' | 'sql' | 'json' | 'markdown';
  content: string;
  isEntry?: boolean;
}

export interface SeedProjectTest {
  name: string;
  check: {
    type:
      | 'dom-exists'
      | 'dom-text'
      | 'dom-attribute'
      | 'dom-count'
      | 'event-click'
      | 'event-input'
      | 'visual-nonblank';
    selector?: string;
    mode?: 'equals' | 'matches';
    value?: string;
    attribute?: string;
    count?: number;
    assert?: {
      type: 'dom-exists' | 'dom-text' | 'dom-attribute' | 'dom-count';
      selector: string;
      mode?: 'equals' | 'matches';
      value?: string;
      attribute?: string;
      count?: number;
    };
    minimumChars?: number;
  };
  description?: string;
}

export interface SeedProject {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: 'frontend' | 'react' | 'api' | 'sql' | 'dataviz' | 'javascript';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  files: SeedProjectFile[];
  previewMode: 'html' | 'react' | 'sql' | 'none';
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;
  mode: 'required' | 'recommended' | 'open_choice';
  specification: {
    objective?: string;
    requiredFeatures?: string[];
    technicalRequirements?: string[];
    designRequirements?: string[];
    accessibilityRequirements?: string[];
    expectedBehaviour?: string;
  };
  rubric: { category: string; weight: number }[];
  tests: SeedProjectTest[];
}

/* ─── Classes ───────────────────────────────────────────────────── */

export interface SeedClass {
  title: string;
  slug: string;
  description: string;
  /** Instructor account key. */
  instructorKey: string;
  /** Optional course slug — links the class to a course. */
  courseSlug?: string;
  /** Optional cohort slug — links the class to a cohort. */
  cohortSlug?: string;
  /** 'past' or 'future' — the runner computes an absolute date. */
  when: 'past' | 'future';
  /** Days offset from now (negative for past). */
  offsetDays: number;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetLink: string;
  /** If true, the class has a placeholder recording attached. */
  hasRecording?: boolean;
}

/* ─── Cohorts ───────────────────────────────────────────────────── */

export interface SeedCohortMember {
  /** Account key. */
  accountKey: string;
  role: 'instructor' | 'assistant' | 'student';
}

export interface SeedCohort {
  name: string;
  slug: string;
  description?: string;
  entityKind: 'course' | 'roadmap';
  /** Course or roadmap slug, depending on entityKind. */
  entitySlug: string;
  startDate?: string;
  endDate?: string;
  archived: boolean;
  members: SeedCohortMember[];
}

/* ─── Announcements ─────────────────────────────────────────────── */

export interface SeedAnnouncement {
  title: string;
  body: string;
  /** Author account key. */
  authorKey: string;
  audience:
    | { kind: 'all' }
    | { kind: 'course'; slug: string }
    | { kind: 'roadmap'; slug: string }
    | { kind: 'cohort'; slug: string };
  /** Days in the past. 0 means "published now". */
  publishedDaysAgo: number;
  /** Optional. Sets pinnedUntil to now + this many days. */
  pinnedForDays?: number;
}

/* ─── Progress ──────────────────────────────────────────────────── */

export interface SeedCourseProgress {
  /** Course slug. */
  courseSlug: string;
  /** Slugs of completed lessons. */
  completedLessonSlugs: string[];
  /** Slug of the current lesson, if any. */
  currentLessonSlug?: string;
  /** Optional: 0-based step index for web lessons. */
  currentStepIndex?: number;
  /** Optional: completed step indexes for web lessons. */
  completedSteps?: number[];
  /** Optional: map of lesson slug -> completed challenge indexes. */
  completedChallenges?: Record<string, number[]>;
}

export interface SeedActivityDay {
  /** Days ago (0 = today). */
  daysAgo: number;
  /** Activities on this day. */
  events: Array<{
    type:
      | 'lesson_completed'
      | 'problem_solved'
      | 'problem_attempted'
      | 'project_saved'
      | 'project_completed'
      | 'class_attended'
      | 'recording_watched'
      | 'achievement_unlocked'
      | 'login';
    xp: number;
    /** Optional refId — set from within the runner. */
    refKey?: string;
  }>;
}

export interface SeedProblemSubmission {
  /** Problem slug. */
  problemSlug: string;
  language: string;
  /** Days ago. */
  daysAgo: number;
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
}

export interface SeedProjectSubmission {
  /** Project slug. */
  projectSlug: string;
  /** Account key of the student who submitted. */
  studentKey: string;
  attemptNumber: number;
  /** Days ago. */
  daysAgo: number;
  status:
    | 'submitted'
    | 'ai_evaluated'
    | 'instructor_reviewed'
    | 'passed'
    | 'needs_improvement'
    | 'resubmission_requested';
  /** If set, an instructor evaluation is written for this submission. */
  instructorReview?: {
    instructorKey: string;
    finalScore: number;
    feedback: string;
    requestResubmission: boolean;
    status: 'passed' | 'needs_improvement' | 'resubmission_requested';
    categoryOverrides: { category: string; score: number; note?: string }[];
  };
}

export interface SeedProgressFixture {
  /** Account whose progress is being seeded. */
  accountKey: string;
  courses: SeedCourseProgress[];
  activity: SeedActivityDay[];
  submissions: SeedProblemSubmission[];
  projectSubmissions: SeedProjectSubmission[];
}