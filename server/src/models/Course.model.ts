import mongoose, { Schema, type Document } from 'mongoose';

type CourseLanguage = string;

export interface CourseDocument extends Document {
  title: string;
  slug: string;
  description: string;
  language: CourseLanguage;
  courseType: string;
  thumbnail?: string;
  totalLessons: number;
  createdBy: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    language: {
      type: String,
      required: true,
    },
    courseType: { type: String, default: 'general', trim: true },
    thumbnail: { type: String },
    totalLessons: { type: Number, default: 0 },
    createdBy: { type: String, required: true, index: true },
    published: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Course = mongoose.model<CourseDocument>('Course', courseSchema);