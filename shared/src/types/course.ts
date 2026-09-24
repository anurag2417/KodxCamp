import type { GlobalPermission, CourseTeamRole } from './permissions.js';

export const COURSE_LANGUAGES = [
  'html-css', 'javascript', 'typescript', 'python', 'ruby', 'java',
  'sql', 'react', 'tailwind', 'dsa-python', 'dsa-javascript',
] as const;

export type CourseLanguage = (typeof COURSE_LANGUAGES)[number];

export type CourseBadge = 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';

export interface ICourseFeature {
  icon?: string;
  label: string;
}

export interface ICourseSellingPoint {
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface ICourseCurriculumModule {
  title: string;
  lessons: number;
  duration?: string;
  items: string[];
}

export interface ICourseInstructorLink {
  label: string;
  url: string;
}

export interface ICourseInstructor {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  links?: ICourseInstructorLink[];
}

export interface ICourseFaqItem {
  question: string;
  answer: string;
}

export interface ICourseProject {
  title: string;
  subtitle?: string;
  image?: string;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

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
  price?: number;
  originalPrice?: number;
  isFree: boolean;

  tagline?: string;
  tags?: string[];
  badge?: CourseBadge;
  heroVideoUrl?: string;
  features?: ICourseFeature[];
  sellingPoints?: ICourseSellingPoint[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: ICourseCurriculumModule[];
  projects?: ICourseProject[];
  instructor?: ICourseInstructor;
  certificateIncluded?: boolean;
  faq?: ICourseFaqItem[];

  createdAt: Date;
  updatedAt: Date;
}

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