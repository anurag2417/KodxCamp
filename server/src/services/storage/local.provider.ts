import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type {
  RecordingUploadInput,
  StoredFile,
  StorageProvider,
} from './types.js';

/**
 * Local-disk storage.
 *
 * The original implementation, lifted into the provider interface.
 * Files land in `server/uploads/{recordings,media}/` and are served
 * statically by `app.ts` at `/uploads/...`.
 *
 * In production on Render, this provider is only active when
 * Cloudinary is not configured — the ephemeral filesystem means
 * uploads disappear on the next deploy.
 */

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const RECORDINGS_DIR = path.join(UPLOAD_ROOT, 'recordings');
const MEDIA_DIR = path.join(UPLOAD_ROOT, 'media');

// Ensure directories exist at import time so the provider is
// self-contained.
for (const dir of [UPLOAD_ROOT, RECORDINGS_DIR, MEDIA_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const localStorageProvider: StorageProvider = {
  name: 'local',

  async saveRecording(input: RecordingUploadInput): Promise<StoredFile> {
    // Disk-storage bridge (Batch 2.2 only). When multer has already
    // written the file, we just report its URL. This branch is
    // removed in Batch 2.3 when multer switches to memory storage.
    if (input.filename && input.path) {
      return {
        url: `/uploads/recordings/${input.filename}`,
        size: input.size,
      };
    }

    // Memory-storage path (Batch 2.3+). Write the buffer.
    if (!input.buffer) {
      throw new Error(
        'Recording input has neither a filename nor a buffer. ' +
          'This is a bug — multer must be configured with either disk or memory storage.'
      );
    }

    const ext = path.extname(input.originalname).toLowerCase() || '.mp4';
    const filename = `rec_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    const fullPath = path.join(RECORDINGS_DIR, filename);
    fs.writeFileSync(fullPath, input.buffer);

    return {
      url: `/uploads/recordings/${filename}`,
      size: input.size,
    };
  },

  async saveMedia(input: RecordingUploadInput): Promise<StoredFile> {
    // Disk-storage bridge (Batch 2.2 only).
    if (input.filename && input.path) {
      return {
        url: `/uploads/media/${input.filename}`,
        size: input.size,
      };
    }

    if (!input.buffer) {
      throw new Error(
        'Media input has neither a filename nor a buffer. ' +
          'This is a bug — multer must be configured with either disk or memory storage.'
      );
    }

    const ext = path.extname(input.originalname).toLowerCase();
    const filename = `med_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    const fullPath = path.join(MEDIA_DIR, filename);
    fs.writeFileSync(fullPath, input.buffer);

    return {
      url: `/uploads/media/${filename}`,
      size: input.size,
    };
  },

  async deleteByUrl(url: string): Promise<void> {
    // Only handle URLs we own. A Cloudinary URL passed here is a
    // no-op — the caller should not have called us with one.
    if (!url.startsWith('/uploads/')) return;

    const relative = url.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOAD_ROOT, relative);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      logger.warn('Failed to delete local file', {
        url,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },

  toAbsoluteUrl(storedUrl: string): string {
    if (!storedUrl) return storedUrl;
    if (storedUrl.startsWith('http')) return storedUrl;
    if (!env.PUBLIC_UPLOAD_BASE_URL) return storedUrl;
    return `${env.PUBLIC_UPLOAD_BASE_URL.replace(/\/$/, '')}${storedUrl}`;
  },
};