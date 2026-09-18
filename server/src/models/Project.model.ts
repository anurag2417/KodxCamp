import mongoose, { Schema, type Document } from 'mongoose';

export type ProjectCategory =
  | 'frontend'
  | 'react'
  | 'api'
  | 'sql'
  | 'dataviz'
  | 'javascript';

export type ProjectFileLang =
  | 'html'
  | 'css'
  | 'javascript'
  | 'jsx'
  | 'sql'
  | 'json'
  | 'markdown';

export interface IProjectFile {
  name: string;
  language: ProjectFileLang;
  content: string;
  isEntry?: boolean;
}

export interface IProject {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: ProjectCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  thumbnail?: string;
  files: IProjectFile[];
  previewMode: 'html' | 'react' | 'sql' | 'none';
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocument extends Omit<IProject, '_id'>, Document {}

const fileSchema = new Schema<IProjectFile>(
  {
    name: { type: String, required: true },
    language: {
      type: String,
      enum: ['html', 'css', 'javascript', 'jsx', 'sql', 'json', 'markdown'],
      required: true,
    },
    content: { type: String, default: '' },
    isEntry: { type: Boolean, default: false },
  },
  { _id: false }
);

const projectSchema = new Schema<ProjectDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: '' },
    category: {
      type: String,
      enum: ['frontend', 'react', 'api', 'sql', 'dataviz', 'javascript'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    topics: { type: [String], default: [] },
    thumbnail: { type: String },
    files: { type: [fileSchema], default: [] },
    previewMode: {
      type: String,
      enum: ['html', 'react', 'sql', 'none'],
      default: 'html',
    },
    instructions: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 60 },
    xpReward: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export const Project = mongoose.model<ProjectDocument>('Project', projectSchema);