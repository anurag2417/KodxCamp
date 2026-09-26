import mongoose, { Schema, type Document } from 'mongoose';
import type { IProjectFile } from './Project.model.js';

export type UserProjectStatus =
  | 'in_progress'
  | 'submitted'
  | 'needs_improvement'
  | 'resubmission_requested'
  | 'completed';

export interface IUserProject {
  _id: string;
  userId: string;
  projectId: string;
  files: IProjectFile[];
  status: UserProjectStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProjectDocument extends Omit<IUserProject, '_id'>, Document {}

const fileSchema = new Schema(
  {
    name: { type: String, required: true },
    language: { type: String, required: true },
    content: { type: String, default: '' },
    isEntry: { type: Boolean, default: false },
  },
  { _id: false }
);

const userProjectSchema = new Schema<UserProjectDocument>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    files: { type: [fileSchema], default: [] },
    status: {
      type: String,
      enum: [
        'in_progress',
        'submitted',
        'needs_improvement',
        'resubmission_requested',
        'completed',
      ],
      default: 'in_progress',
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

userProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const UserProject = mongoose.model<UserProjectDocument>(
  'UserProject',
  userProjectSchema
);