/**
 * Media library.
 *
 * Master Spec, section 45:
 *   "A central media library stores uploaded videos, images,
 *    PDFs, and other assets. Assets are reusable — the same image
 *    can appear in multiple courses."
 *
 * A MediaAsset is an immutable record of one uploaded file. The
 * storage service (S3-compatible, or local disk in dev) owns the
 * bytes; this collection owns the metadata and the public URL.
 *
 * The library is a *new* surface. Existing content that stores a
 * thumbnail as a URL string (Course.thumbnail, Project.thumbnail,
 * Class.recording.url) keeps working as-is. This batch does not
 * retrofit those fields — that's a future migration once the library
 * is proven.
 */

export type MediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'other';

export interface IMediaAsset {
  _id: string;
  ownerId: string;
  kind: MediaKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  /** Public URL. Served by the storage layer. */
  url: string;
  /**
   * Optional thumbnail URL. Populated for videos when the uploader
   * supplies one (or when a server-side poster is generated in a
   * later batch). Absent for images and other types.
   */
  thumbUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The shape used by the upload endpoint. Files come through multer,
 * not JSON, so this type describes what the server extracts from the
 * file object plus any user-supplied metadata.
 */
export interface IMediaUploadInput {
  kind?: MediaKind;
  thumbUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
}