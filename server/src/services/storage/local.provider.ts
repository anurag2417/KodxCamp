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
 * Files land in `server/uploads/{recordings,media}/` and are served
 * statically by `app.ts` at `/uploads/...`.
 *
 * In production on Render, this provider is only active when
 * Cloudinary is not configured — the ephemeral filesystem means
 * uploads disappear on the next deploy. See `isCloudinaryConfigured`.
 *
 * As of Batch 2.3 both providers assume a Buffer input. Multer is
 * configured with memory storage for the paths that reach this
 * provider, so the buffer is always present. The provider writes it
 * to disk under a name it generates.
 */

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const RECORDINGS_DIR = path.join(UPLOAD_ROOT, 'recordings');
const MEDIA_DIR = path.join(UPLOAD_ROOT, 'media');

// Ensure directories exist at import time so the provider is
// self-contained.
for (const dir of [UPLOAD_ROOT, RECORDINGS_DIR, MEDIA_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function requireBuffer(
  input: RecordingUploadInput,
  kind: 'recording' | 'media'
): Buffer {
  if (!input.buffer) {
    throw new Error(
      `${kind} input has no buffer. This is a bug — multer must be ` +
        `configured with memory storage for the paths that reach the ` +
        `local provider.`
    );
  }
  return input.buffer;
}

export const localStorageProvider: StorageProvider = {
  name: 'local',

  async saveRecording(input: RecordingUploadInput): Promise<StoredFile> {
    const buffer = requireBuffer(input, 'recording');

    const ext = path.extname(input.originalname).toLowerCase() || '.mp4';
    const filename = `rec_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    const fullPath = path.join(RECORDINGS_DIR, filename);
    fs.writeFileSync(fullPath, buffer);

    return {
      url: `/uploads/recordings/${filename}`,
      size: input.size,
    };
  },

  async saveMedia(input: RecordingUploadInput): Promise<StoredFile> {
    const buffer = requireBuffer(input, 'media');

    const ext = path.extname(input.originalname).toLowerCase();
    const filename = `med_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    const fullPath = path.join(MEDIA_DIR, filename);
    fs.writeFileSync(fullPath, buffer);

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