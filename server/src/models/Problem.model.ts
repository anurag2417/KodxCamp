import mongoose, { Schema, type Document } from 'mongoose';

type Difficulty = 'easy' | 'medium' | 'hard';
type ProblemOutputMode = 'return' | 'print';
type CanonicalizationId =
  | 'trim-trailing-newline'
  | 'trim-all'
  | 'exact';

export interface ProblemTestCase {
  input: string;
  isHidden: boolean;
  expectedOutput?: string;
  expectedOutputHash?: string;
  canonicalization?: CanonicalizationId;
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
    isHidden: { type: Boolean, default: false, required: true },

    // Visible tests only
    expectedOutput: { type: String, required: false },

    // Hidden tests only
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

// Enforce the visible/hidden invariant before save. We use a sync
// validator here rather than a pre('validate') hook so the error
// surfaces through Mongoose's normal ValidationError path (which the
// global error handler already converts into a clean 400).
testCaseSchema.pre('validate', function (next) {
  const tc = this as unknown as ProblemTestCase;

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