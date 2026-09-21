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

export interface CourseDocument extends Document {
  title: string;
  slug: string;
  description: string;
  language: CourseLanguage;
  thumbnail?: string;
  totalLessons: number;
  createdBy: string;
  members: CourseTeamMember[];
  published: boolean;
}

interface CourseTeamMember {
  userId: string;
  role: 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer';
  addedAt?: Date;
  addedBy: string;
}

const teamMemberSchema = new Schema<CourseTeamMember>(
  {
    userId: { type: String, required: true },
    role: {
      type: String,
      enum: ['lead', 'author', 'reviewer', 'ta', 'viewer'],
      required: true,
    },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: String, required: true },
  },
  { _id: false }
);

const courseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    language: {
      type: String,
      enum: [
        'html-css',
        'javascript',
        'typescript',
        'python',
        'sql',
        'react',
        'tailwind',
        'dsa-python',
        'dsa-javascript',
      ] as CourseLanguage[],
      required: true,
    },
    thumbnail: { type: String },
    totalLessons: { type: Number, default: 0 },
    createdBy: { type: String, required: true, index: true },
    members: { type: [teamMemberSchema], default: [] },
    published: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

courseSchema.index({ 'members.userId': 1 });

export const Course = mongoose.model<CourseDocument>('Course', courseSchema);