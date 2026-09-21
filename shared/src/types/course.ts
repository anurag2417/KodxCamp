export type CourseLanguage =
  | 'html-css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'react'
  | 'tailwind'
  | 'dsa-python'
  | 'dsa-javascript';

export type CourseTeamRole = 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer';

export interface ICourseTeamMember {
  userId: string;
  role: CourseTeamRole;
  addedAt: Date;
  addedBy: string;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
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