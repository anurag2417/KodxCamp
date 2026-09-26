import mongoose, { Schema, type Document } from 'mongoose';

export type MediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'other';

export interface MediaAssetDocument extends Document {
  ownerId: string;
  kind: MediaKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  createdAt: Date;
  updatedAt: Date;
}

const mediaAssetSchema = new Schema<MediaAssetDocument>(
  {
    ownerId: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ['image', 'video', 'audio', 'pdf', 'other'],
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    url: { type: String, required: true },
    thumbUrl: { type: String },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    durationSec: { type: Number, min: 0 },
  },
  { timestamps: true },
);

/**
 * The library query: "my assets, newest first, optionally filtered
 * by kind." One compound index covers both the unfiltered list and
 * the kind-filtered list.
 */
mediaAssetSchema.index({ ownerId: 1, kind: 1, createdAt: -1 });

/**
 * The admin's "all assets" query. Same shape, scoped globally.
 */
mediaAssetSchema.index({ createdAt: -1 });

export const MediaAsset = mongoose.model<MediaAssetDocument>(
  'MediaAsset',
  mediaAssetSchema,
);