import type { CanonicalizationId } from './problem';

/**
 * Every language KodxCamp can execute in the browser.
 *
 * When adding a language, update this list AND:
 *   - server/src/models/Course.model.ts   (Mongoose enum)
 *   - server/src/models/Lesson.model.ts   (Mongoose enum)
 *   - server/src/services/bulk.service.ts (Zod enum)
 *   - client/src/shared/runner/adapters/  (a new RunnerAdapter)
 *
 * Centralizing this constant would let the Mongoose and Zod schemas
 * reference it directly. Deferred to a future cleanup; for now the
 * list is duplicated and must be kept in sync manually.
 */
export const COURSE_LANGUAGES = [
  'html-css',
  'javascript',
  'typescript',
  'python',
  'ruby',
  'java',
  'sql',
  'react',
  'tailwind',
  'dsa-python',
  'dsa-javascript',
] as const;

export type CourseLanguage = (typeof COURSE_LANGUAGES)[number];

export type CourseTeamRole = 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer';

export interface ICourseTeamMember {
  userId: string;
  role: CourseTeamRole;
  addedAt: Date;
  addedBy: string;
}

export interface ITestCase {
  input: string;
  isHidden: boolean;
  expectedOutput?: string;
  expectedOutputHash?: string;
  canonicalization?: CanonicalizationId;
}

export interface ILesson {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  solution: string;
  functionName: string;
  outputMode: 'return' | 'print';
  language: CourseLanguage;
  testCases: ITestCase[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: CourseLanguage;
  thumbnail?: string;
  lessons: ILesson[];
  totalLessons: number;
  createdBy: string;
  members: ICourseTeamMember[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}