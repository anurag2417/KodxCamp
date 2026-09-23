import mongoose, { Schema, type Document } from 'mongoose';

interface ISubmission {
  _id?: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error';
  passedTests?: number;
  totalTests?: number;
  runtimeMs?: number;
}

export interface SubmissionDocument extends Omit<ISubmission, '_id'>, Document {}

const submissionSchema = new Schema<SubmissionDocument>(
  {
    userId: { type: String, required: true, index: true },
    problemId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'runtime_error', 'compile_error'],
      required: true,
    },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    runtimeMs: { type: Number },
  },
  { timestamps: true }
);

submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });

export const Submission = mongoose.model<SubmissionDocument>(
  'Submission',
  submissionSchema
);