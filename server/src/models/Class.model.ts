import mongoose, { Schema, type Document } from 'mongoose';

export type ClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface IClassChapter {
  title: string;
  startSec: number;
}

export interface IClassRecording {
  url: string;
  durationSec: number;
  sizeBytes: number;
  uploadedAt: Date;
  chapters?: IClassChapter[];
}

export interface IClass {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructorId: string;
  instructorName: string;
  courseId?: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: ClassStatus;
  meetLink: string;
  recording?: IClassRecording;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassDocument extends Omit<IClass, '_id'>, Document {}

const chapterSchema = new Schema<IClassChapter>(
  {
    title: { type: String, required: true },
    startSec: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const recordingSchema = new Schema<IClassRecording>(
  {
    url: { type: String, required: true },
    durationSec: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    chapters: { type: [chapterSchema], default: [] },
  },
  { _id: false }
);

const classSchema = new Schema<ClassDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    instructorId: { type: String, required: true, index: true },
    instructorName: { type: String, required: true },
    courseId: { type: String, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 60, min: 5, max: 480 },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    meetLink: { type: String, required: true },
    recording: { type: recordingSchema, default: undefined },
  },
  { timestamps: true }
);

classSchema.index({ scheduledAt: -1 });

export const Class = mongoose.model<ClassDocument>('Class', classSchema);