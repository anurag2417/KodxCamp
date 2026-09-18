import mongoose, { Schema, type Document } from 'mongoose';
type CourseLanguage =
  | 'html-css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'react'
  | 'tailwind'
  | 'dsa-python'
  | 'dsa-javascript';

interface ICourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: CourseLanguage;
  thumbnail?: string;
  totalLessons: number;
}

export interface CourseDocument extends Omit<ICourse, '_id'>, Document {}

const courseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    language: {
      type: String,
      enum: [
        'html-css', 'javascript', 'typescript', 'python',
        'sql', 'react', 'tailwind', 'dsa-python', 'dsa-javascript',
      ] as CourseLanguage[],
      required: true,
    },
    thumbnail: { type: String },
    totalLessons: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Course = mongoose.model<CourseDocument>('Course', courseSchema);