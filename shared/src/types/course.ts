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

/**
 * Lesson test case. Same semantics as `IProblemTestCase`:
 * `expectedOutput` is plaintext, `isHidden` is a display flag only.
 */
export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
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