import mongoose, { Schema, type Document } from 'mongoose';

type Difficulty = 'easy' | 'medium' | 'hard';
type ProblemOutputMode = 'return' | 'print';
type ProblemScope = 'global' | 'course';
type ProblemTier = 'starter' | 'interview';

export interface ProblemTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ProblemDocument extends Document {
  problemId: number;
  /** @deprecated Legacy field. Kept one batch, then removed. */
  number?: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: ProblemOutputMode;
  starterCode: Record<string, string>;
  testCases: ProblemTestCase[];
  sqlSetup?: string;
  scope: ProblemScope;
  courseId?: string;
  tier: ProblemTier;
}

const testCaseSchema = new Schema<ProblemTestCase>(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false, required: true },
  },
  { _id: false }
);

const problemSchema = new Schema<ProblemDocument>(
  {
    problemId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    number: { type: Number, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'] as Difficulty[],
      required: true,
    },
    topics: { type: [String], default: [] },
    statement: { type: String, required: true },
    functionName: {
      type: String,
      required: true,
      default: 'solve',
      trim: true,
    },
    outputMode: {
      type: String,
      enum: ['return', 'print'] as ProblemOutputMode[],
      default: 'return',
    },
    starterCode: { type: Schema.Types.Mixed, default: {} },
    testCases: { type: [testCaseSchema], default: [] },
    sqlSetup: { type: String, default: undefined },
    scope: {
      type: String,
      enum: ['global', 'course'] as ProblemScope[],
      default: 'global',
      index: true,
    },
    courseId: {
      type: String,
      default: undefined,
      index: true,
    },
    tier: {
      type: String,
      enum: ['starter', 'interview'] as ProblemTier[],
      default: 'starter',
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for the "global practice catalog, filtered by tier" query.
problemSchema.index({ scope: 1, tier: 1, problemId: 1 });

// Compound index for "course-scoped problems attached to a course".
problemSchema.index({ scope: 1, courseId: 1 });

export const Problem = mongoose.model<ProblemDocument>('Problem', problemSchema);