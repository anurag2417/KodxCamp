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

export interface ILesson {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  solution: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}