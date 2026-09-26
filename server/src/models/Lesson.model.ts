import mongoose, { Schema, type Document } from 'mongoose';

type CourseLanguage = string;
type ProblemOutputMode = 'return' | 'print';

interface LessonTestCase {
  input: string;
  expectedOutput: string;
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

/**
 * A tutorial challenge, embedded on the lesson.
 * See `shared/src/types/tutorial.ts` for the canonical type.
 */
interface TutorialChallenge {
  title: string;
  instructions: string;
  hint?: string;
  starterCode: string;
  checks: Array<
    | { type: 'includes'; value: string; label?: string }
    | {
        type: 'dom';
        selector: string;
        expect: 'exists' | 'textEquals' | 'textMatches';
        value?: string;
        label?: string;
      }
  >;
  language: string;
}

interface LessonFields {
  courseId: string;
  moduleId?: string;
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
  /**
   * FreeCodeCamp-style guided exercises. Empty by default.
   * When non-empty, the student sees them as a strip above the
   * editor and works through them in order.
   */
  tutorialChallenges: TutorialChallenge[];
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

/**
 * A single tutorial challenge check. `_id: false` because these are
 * positional data — a challenge's checks are identified by index, not
 * by an id.
 */
const challengeCheckSchema = new Schema(
  {
    type: { type: String, enum: ['includes', 'dom'], required: true },
    // 'includes'
    value: { type: String },
    // 'dom'
    selector: { type: String },
    expect: {
      type: String,
      enum: ['exists', 'textEquals', 'textMatches'],
    },
    // shared
    label: { type: String },
  },
  { _id: false, strict: true }
);

const tutorialChallengeSchema = new Schema<TutorialChallenge>(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, required: true },
    hint: { type: String, default: undefined },
    starterCode: { type: String, default: '' },
    checks: { type: [challengeCheckSchema], default: [] },
    language: { type: String, default: 'html', trim: true },
  },
  { _id: false }
);

const lessonSchema = new Schema<LessonDocument>(
  {
    courseId: { type: String, required: true, index: true },
    moduleId: { type: String, required: false, index: true },
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
    tutorialChallenges: { type: [tutorialChallengeSchema], default: [] },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });

export const Lesson = mongoose.model<LessonDocument>('Lesson', lessonSchema);