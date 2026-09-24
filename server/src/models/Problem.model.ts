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
  /**
   * Map of language id (or web filename) -> starter code.
   *
   * Stored as Mixed rather than Schema.Map because Mongoose Map
   * rejects keys containing a dot, and web problems use
   * `index.html` / `styles.css` / `script.js` as keys.
   *
   * Expected shape:
   *   {
   *     javascript: '...',
   *     python: '...',
   *     'html-css': '...',        // full merged page
   *     'index.html': '...',      // per-file starter for the editor
   *     'styles.css': '...',
   *     'script.js': '...',
   *   }
   */
  starterCode: Record<string, string>;
  testCases: ProblemTestCase[];
  /**
   * SQL-only. Executed once before any test case runs. See
   * `shared/src/types/problem.ts` for the full contract.
   */
  sqlSetup?: string;
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
    starterCode: { type: Schema.Types.Mixed, default: {} },
    testCases: { type: [testCaseSchema], default: [] },
    sqlSetup: { type: String, default: undefined },
  },
  { timestamps: true }
);

export const Problem = mongoose.model<ProblemDocument>(
  'Problem',
  problemSchema
);