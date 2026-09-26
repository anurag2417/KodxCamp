/**
 * Storage provider interface.
 *
 * Two implementations ship today:
 *
 *   - LocalStorageProvider     — writes to `server/uploads/` on disk.
 *                                Used in development, and as a
 *                                fallback when Cloudinary isn't
 *                                configured.
 *
 *   - CloudinaryStorageProvider — uploads to Cloudinary, returns a
 *                                `https://res.cloudinary.com/...` URL.
 *                                Used in production.
 *
 * The provider owns the bytes. Callers only see the returned URL and
 * size. This is what lets the class recording flow, the media library,
 * and anything else that stores a file work identically regardless of
 * where the file actually lives.
 */

/** Metadata about a stored file, returned by every upload. */
export interface StoredFile {
  /** Publicly resolvable URL. Relative (`/uploads/...`) for local, absolute for Cloudinary. */
  url: string;
  /** Size in bytes. */
  size: number;
}

/**
 * Input for a storage upload.
 *
 * The shape mirrors multer's `Express.Multer.File` under memory
 * storage. Controllers pass `req.file` directly; no mapping step is
 * needed.
 *
 * Batch 2.3 removed the disk-storage bridge (`filename`, `path`).
 * Both multer storages are now memory-based for the paths that feed
 * this interface.
 */
export interface RecordingUploadInput {
  /** The file bytes. Always present under memory storage. */
  buffer?: Buffer;

  /** Original filename as uploaded by the client. */
  originalname: string;

  /** MIME type as reported by the client. */
  mimetype: string;

  /** File size in bytes. */
  size: number;
}

export interface StorageProvider {
  /** Identifier used in logs and health checks. */
  readonly name: 'local' | 'cloudinary';

  /** Persist a class recording and return its public URL + size. */
  saveRecording(input: RecordingUploadInput): Promise<StoredFile>;

  /**
   * Persist a media library asset and return its public URL + size.
   *
   * Separate from `saveRecording` because the two have different
   * storage rules: recordings go under a `recordings/` prefix in
   * Cloudinary, media goes under `media/`.
   */
  saveMedia(input: RecordingUploadInput): Promise<StoredFile>;

  /**
   * Remove a file by its stored URL. Best-effort — never throws on
   * a missing file or a failed delete. A dangling file on disk is a
   * smaller problem than a dangling record that 404s.
   */
  deleteByUrl(url: string): Promise<void>;

  /**
   * Convert a stored URL to an absolute URL for the client.
   *
   * - If `PUBLIC_UPLOAD_BASE_URL` is set (e.g. a CDN in front of
   *   local storage), uses it.
   * - If the stored URL is already absolute (Cloudinary), returns
   *   it as-is.
   * - Otherwise returns the relative path — the client resolves it
   *   against `VITE_API_URL`.
   */
  toAbsoluteUrl(storedUrl: string): string;
}