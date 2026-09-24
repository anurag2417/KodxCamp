import type { GlobalPermission, CourseTeamRole } from './permissions.js';

export const COURSE_LANGUAGES = [
  'html-css', 'javascript', 'typescript', 'python', 'ruby', 'java',
  'sql', 'react', 'tailwind', 'dsa-python', 'dsa-javascript',
] as const;

export type CourseLanguage = (typeof COURSE_LANGUAGES)[number];

/**
 * Lesson test case. Same semantics as `IProblemTestCase`:
 * `expectedOutput` is plaintext, `isHidden` is a display flag only.
 */
export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

/**
 * A single step inside a step-by-step web lesson.
 */
export interface IWebLessonStep {
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

export interface ILesson {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  starterFiles?: Record<string, string>;
  webChecks?: {
    requiredHtml: string[];
    requiredCss: string[];
    requiredJs: string[];
  };
  solution: string;
  functionName: string;
  outputMode: 'return' | 'print';
  language: CourseLanguage;
  testCases: ITestCase[];
  steps: IWebLessonStep[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A course. Team members are no longer embedded here — see
 * `CourseMembership` in `permissions.ts` (or in the server's
 * `CourseMembership.model.ts`).
 */
export interface ICourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: CourseLanguage;
  thumbnail?: string;
  totalLessons: number;
  createdBy: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A staff membership in a course. One row per (userId, courseId)
 * pair. Written by the team management flows and read by every
 * permission check.
 */
export interface ICourseMembership {
  _id: string;
  userId: string;
  courseId: string;
  role: CourseTeamRole;
  addedAt: Date;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type { GlobalPermission, CourseTeamRole };