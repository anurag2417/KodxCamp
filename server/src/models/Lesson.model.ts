import mongoose, { Schema, type Document } from 'mongoose';

type CourseLanguage =
  | 'html-css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'ruby'
  | 'java'
  | 'sql'
  | 'react'
  | 'tailwind'
  | 'dsa-python'
  | 'dsa-javascript';

type ProblemOutputMode = 'return' | 'print';

type CanonicalizationId = 'trim-trailing-newline' | 'trim-all' | 'exact';

interface LessonTestCase {
  input: string;
  isHidden: boolean;
  expectedOutput?: string;
  expectedOutputHash?: string;
  canonicalization?: CanonicalizationId;
}

interface LessonFields {
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  solution: string;
  functionName: string;
  outputMode: ProblemOutputMode;
  language: CourseLanguage;
  testCases: LessonTestCase[];
}

export interface LessonDocument extends LessonFields, Document {}

const testCaseSchema = new Schema<LessonTestCase>(
  {
    input: { type: String, default: '' },
    isHidden: { type: Boolean, default: false, required: true },
    expectedOutput: { type: String, required: false },
    expectedOutputHash: {
      type: String,
      required: false,
      match: /^[0-9a-f]{64}$/,
    },
    canonicalization: {
      type: String,
      enum: ['trim-trailing-newline', 'trim-all', 'exact'],
      default: 'trim-trailing-newline',
    },
  },
  { _id: false }
);

testCaseSchema.pre('validate', function (next) {
  const tc = this as unknown as LessonTestCase;

  if (tc.isHidden) {
    if (!tc.expectedOutputHash) {
      return next(
        new Error('Hidden test case requires expectedOutputHash')
      );
    }
    if (tc.expectedOutput) {
      return next(
        new Error(
          'Hidden test case must not store plaintext expectedOutput'
        )
      );
    }
  } else {
    if (!tc.expectedOutput) {
      return next(
        new Error('Visible test case requires expectedOutput')
      );
    }
    if (tc.expectedOutputHash) {
      return next(
        new Error(
          'Visible test case must not store expectedOutputHash'
        )
      );
    }
  }
  next();
});

const lessonSchema = new Schema<LessonDocument>(
  {
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    order: { type: Number, required: true },
    content: { type: String, required: true },
    starterCode: { type: String, default: '' },
    solution: { type: String, default: '' },
    functionName: { type: String, default: 'solve', trim: true },
    outputMode: {
      type: String,
      enum: ['return', 'print'] as ProblemOutputMode[],
      default: 'print',
    },
    language: {
      type: String,
      enum: [
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
      ] as CourseLanguage[],
      required: true,
    },
    testCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });

export const Lesson = mongoose.model<LessonDocument>('Lesson', lessonSchema);