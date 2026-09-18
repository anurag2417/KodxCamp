import mongoose, { Schema, type Document } from 'mongoose';
type Difficulty = 'easy' | 'medium' | 'hard';

interface IProblem {
  _id: unknown;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  starterCode: Record<string, string>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface ProblemDocument extends Omit<IProblem, '_id'>, Document {}

const testCaseSchema = new Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
  },
  { _id: false }
);

const problemSchema = new Schema<ProblemDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'] as Difficulty[],
      required: true,
    },
    topics: { type: [String], default: [] },
    statement: { type: String, required: true },
    starterCode: { type: Map, of: String, default: {} },
    testCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

export const Problem = mongoose.model<ProblemDocument>('Problem', problemSchema);