import mongoose, { Schema, type Document } from 'mongoose';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestionDocument extends Document {
  courseId: string;
  lessonId?: string;
  prompt: string;
  options: QuizOption[];
  mode: 'single' | 'multiple';
  correctOptionIds: string[];
  correctOptionId?: string;
  explanation?: string;
  order: number;
}

const optionSchema = new Schema<QuizOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const quizQuestionSchema = new Schema<QuizQuestionDocument>(
  {
    courseId: { type: String, required: true, index: true },
    lessonId: { type: String, index: true },
    prompt: { type: String, required: true, trim: true },
    options: { type: [optionSchema], required: true },
    mode: { type: String, enum: ['single', 'multiple'], default: 'single' },
    correctOptionIds: { type: [String], default: [] },
    correctOptionId: { type: String },
    explanation: { type: String, default: '' },
    order: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

quizQuestionSchema.index({ courseId: 1, order: 1 });

export const QuizQuestion = mongoose.model<QuizQuestionDocument>(
  'QuizQuestion',
  quizQuestionSchema
);
