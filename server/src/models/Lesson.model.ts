import mongoose, { Schema, type Document } from 'mongoose';
type CourseLanguage =
  | 'html-css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'react'
  | 'tailwind'
  | 'dsa-python'
  | 'dsa-javascript';

export interface LessonDocument extends Document {
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  solution: string;
  language: CourseLanguage;
  testCases: Array<{ input: string; expectedOutput: string }>;
}

const testCaseSchema = new Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
  },
  { _id: false }
);

const lessonSchema = new Schema<LessonDocument>(
  {
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    order: { type: Number, required: true },
    content: { type: String, required: true },
    starterCode: { type: String, default: '' },
    solution: { type: String, default: '' },
    language: {
      type: String,
      enum: [
        'html-css',
        'javascript',
        'typescript',
        'python',
        'sql',
        'react',
        'tailwind',
        'dsa-python',
        'dsa-javascript',
      ] as CourseLanguage[],
      required: true,
    },
    testCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });

export const Lesson = mongoose.model<LessonDocument>('Lesson', lessonSchema);