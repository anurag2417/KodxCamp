import mongoose, { Schema, type Document } from 'mongoose';

export interface ModuleDocument extends Document {
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<ModuleDocument>(
  {
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: undefined },
    order: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

/**
 * Modules within a course are identified by (courseId, order).
 * Enforcing order uniqueness per course prevents two modules from
 * claiming the same slot during a reorder.
 */
moduleSchema.index({ courseId: 1, order: 1 }, { unique: true });

export const Module = mongoose.model<ModuleDocument>('Module', moduleSchema);