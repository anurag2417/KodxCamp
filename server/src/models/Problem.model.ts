import mongoose, { Schema, type Document } from 'mongoose';

type Difficulty = 'easy' | 'medium' | 'hard';
type ProblemOutputMode = 'return' | 'print';

export interface ProblemTestCase {
  input: string;
  expectedOutput: string;
  /** Display flag. Hides input/output from the student's test panel. */
  isHidden: boolean;
}

export interface ProblemDocument extends Document {
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: ProblemOutputMode;
  starterCode: Map<string, string>;
  testCases: ProblemTestCase[];
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
    number: { type: Number, required: true, unique: true, index: true },
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
    starterCode: { type: Map, of: String, default: {} },
    testCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

export const Problem = mongoose.model<ProblemDocument>(
  'Problem',
  problemSchema
);