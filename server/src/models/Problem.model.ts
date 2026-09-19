import mongoose, { Schema, type Document } from 'mongoose';
type Difficulty = 'easy' | 'medium' | 'hard';
type ProblemOutputMode = 'return' | 'print';

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
  testCases: Array<{ input?: string; expectedOutput: string }>;
}

const testCaseSchema = new Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
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

export const Problem = mongoose.model<ProblemDocument>('Problem', problemSchema);