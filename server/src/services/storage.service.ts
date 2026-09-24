import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface StoredFile {
  /** Publicly resolvable URL for the client. */
  url: string;
  /** Size in bytes. */
  size: number;
}

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const RECORDINGS_DIR = path.join(UPLOAD_ROOT, 'recordings');

// Ensure directories exist at import time
for (const dir of [UPLOAD_ROOT, RECORDINGS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const storageService = {
  /**
   * Persist an uploaded file and return its public URL + size.
   *
   * Current implementation: multer already wrote the file to disk; we just
   * compute the public URL.
   *
   * Future: when CLOUDINARY_URL is set, replace the body with an upload call.
   * The interface stays the same.
   */
  async saveRecording(file: Express.Multer.File): Promise<StoredFile> {
    const filename = file.filename;
    const url = `/uploads/recordings/${filename}`;
    return { url, size: file.size };
  },

  /**
   * Remove a recording by URL. Best-effort - never throws.
   */
  async deleteRecording(url: string): Promise<void> {
    if (!url.startsWith('/uploads/recordings/')) return;

    const filename = url.replace('/uploads/recordings/', '');
    const fullPath = path.join(RECORDINGS_DIR, filename);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      logger.warn('Failed to delete recording', {
        url,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },

  /**
   * Convert a stored URL into an absolute URL for the client.
   *
   * - If PUBLIC_UPLOAD_BASE_URL is set (e.g. a CDN), uses it.
   * - If the stored URL is already absolute, returns it as-is.
   * - Otherwise returns the relative path - the client resolves it against
   *   VITE_API_URL.
   */
  toAbsoluteUrl(storedUrl: string): string {
    if (!storedUrl) return storedUrl;
    if (storedUrl.startsWith('http')) return storedUrl;
    if (!env.PUBLIC_UPLOAD_BASE_URL) return storedUrl;
    return `${env.PUBLIC_UPLOAD_BASE_URL.replace(/\/$/, '')}${storedUrl}`;
  },
};