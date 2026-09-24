import mongoose, { Schema, type Document } from 'mongoose';
type CourseLanguage = string;

type ProblemOutputMode = 'return' | 'print';

interface LessonTestCase {
  input: string;
  expectedOutput: string;
  /** Display flag. Hides input/output from the student's test panel. */
  isHidden: boolean;
}

interface LessonFields {
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  contentType: string;
  starterCode: string;
  starterFiles?: Record<string, string>;
  webChecks?: {
    requiredHtml: string[];
    requiredCss: string[];
    requiredJs: string[];
  };
  solution: string;
  problemSlug?: string;
  functionName: string;
  outputMode: ProblemOutputMode;
  language: CourseLanguage;
  testCases: LessonTestCase[];
}

export interface LessonDocument extends LessonFields, Document {}

const testCaseSchema = new Schema<LessonTestCase>(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false, required: true },
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
    contentType: { type: String, default: 'lesson', trim: true },
    starterCode: { type: String, default: '' },
    starterFiles: { type: Map, of: String, default: undefined },
    webChecks: {
      requiredHtml: { type: [String], default: [] },
      requiredCss: { type: [String], default: [] },
      requiredJs: { type: [String], default: [] },
    },
    solution: { type: String, default: '' },
    problemSlug: { type: String, trim: true },
    functionName: { type: String, default: 'solve', trim: true },
    outputMode: {
      type: String,
      enum: ['return', 'print'] as ProblemOutputMode[],
      default: 'print',
    },
    language: {
      type: String,
      required: true,
    },
    testCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });

export const Lesson = mongoose.model<LessonDocument>('Lesson', lessonSchema);