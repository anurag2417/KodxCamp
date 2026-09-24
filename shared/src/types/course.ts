export const COURSE_LANGUAGES = [
  'html-css', 'javascript', 'typescript', 'python', 'ruby', 'java',
  'sql', 'react', 'tailwind', 'dsa-python', 'dsa-javascript',
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

/**
 * A single step inside a step-by-step web lesson.
 *
 * Steps are only meaningful for lessons whose `language` is one of the
 * web languages (`html-css`, `react`, `tailwind`). For other languages
 * `Lesson.steps` is an empty array and the classic single-shot
 * experience applies.
 *
 * A student can only move to step N+1 after their current files pass
 * step N's `webChecks`. The check runs client-side, in the same
 * validator that already exists for classic web lessons.
 */
export interface IWebLessonStep {
  /** Short title shown in the step header. */
  title: string;
  /** Markdown-ish instructions shown above the editor for this step. */
  instructions: string;
  /** Optional hint shown if the student is stuck. */
  hint?: string;
  /**
   * Starter files for this step. Each step starts the student from
   * this snapshot so a broken earlier step doesn't cascade.
   *
   * Keys are fixed: 'index.html', 'styles.css', 'script.js'.
   * Missing keys are treated as empty strings.
   */
  starterFiles: {
    'index.html': string;
    'styles.css': string;
    'script.js': string;
  };
  /**
   * Tokens that must be present in the corresponding file for the step
   * to pass. Empty arrays mean "no requirement for that file".
   *
   * Same semantics as the classic web-lesson `webChecks`, but scoped
   * to this step.
   */
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
  /**
   * Step-by-step mode. When this array is non-empty AND the lesson's
   * language is a web language, the lesson renders in guided mode.
   * When empty, the classic single-shot editor is used.
   */
  steps: IWebLessonStep[];
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
  totalLessons: number;
  createdBy: string;
  members: ICourseTeamMember[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}