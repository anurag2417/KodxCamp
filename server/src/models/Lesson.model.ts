import mongoose, { Schema, type Document } from 'mongoose';

type CourseLanguage = string;
type ProblemOutputMode = 'return' | 'print';

interface LessonTestCase {
  input: string;
  expectedOutput: string;
  /** Display flag. Hides input/output from the student's test panel. */
  isHidden: boolean;
}

interface WebChecks {
  requiredHtml: string[];
  requiredCss: string[];
  requiredJs: string[];
}

interface WebLessonStep {
  title: string;
  instructions: string;
  hint?: string;
  starterFiles: {
    'index.html': string;
    'styles.css': string;
    'script.js': string;
  };
  webChecks: WebChecks;
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
  webChecks?: WebChecks;
  solution: string;
  problemSlug?: string;
  functionName: string;
  outputMode: ProblemOutputMode;
  language: CourseLanguage;
  testCases: LessonTestCase[];
  /** Step-by-step mode. Empty array means classic single-shot. */
  steps: WebLessonStep[];
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

const webChecksSchema = new Schema<WebChecks>(
  {
    requiredHtml: { type: [String], default: [] },
    requiredCss: { type: [String], default: [] },
    requiredJs: { type: [String], default: [] },
  },
  { _id: false }
);

const starterFilesSchema = new Schema(
  {
    'index.html': { type: String, default: '' },
    'styles.css': { type: String, default: '' },
    'script.js': { type: String, default: '' },
  },
  { _id: false }
);

const webLessonStepSchema = new Schema<WebLessonStep>(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, required: true },
    hint: { type: String, default: undefined },
    starterFiles: {
      type: starterFilesSchema,
      default: () => ({
        'index.html': '',
        'styles.css': '',
        'script.js': '',
      }),
    },
    webChecks: {
      type: webChecksSchema,
      default: () => ({
        requiredHtml: [],
        requiredCss: [],
        requiredJs: [],
      }),
    },
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
    starterFiles: { type: Schema.Types.Mixed, default: undefined },
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
    steps: { type: [webLessonStepSchema], default: [] },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });

export const Lesson = mongoose.model<LessonDocument>('Lesson', lessonSchema);