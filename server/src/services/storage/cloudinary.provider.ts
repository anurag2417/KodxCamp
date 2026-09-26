import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import type {
  RecordingUploadInput,
  StoredFile,
  StorageProvider,
} from './types.js';

/**
 * Cloudinary storage.
 *
 * Files are uploaded via `upload_stream`, which takes a Buffer and
 * pipes it to Cloudinary. This requires multer to be configured with
 * memory storage — see Batch 2.3.
 *
 * Two folders are used:
 *
 *   - `kodxcamp/recordings/` — class recordings
 *   - `kodxcamp/media/`      — media library assets
 *
 * Delivery URLs are stable: `https://res.cloudinary.com/<cloud>/...`.
 * The URL never changes once uploaded, so storing it in the DB is
 * safe and preferred over storing the public ID.
 */

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/**
 * Upload a Buffer to Cloudinary and return the resulting URL.
 *
 * Uses `resource_type: 'auto'` so Cloudinary classifies the file
 * (image / video / raw) automatically. This matters for the media
 * library, which accepts any file type.
 */
async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  resourceType: 'auto' | 'video' | 'raw' = 'auto'
): Promise<{ url: string; bytes: number; publicId: string }> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload returned no result'));
          return;
        }
        resolve({
          url: result.secure_url,
          bytes: result.bytes,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

export const cloudinaryStorageProvider: StorageProvider = {
  name: 'cloudinary',

  async saveRecording(input: RecordingUploadInput): Promise<StoredFile> {
    if (!input.buffer) {
      throw new ApiError(
        500,
        'Recording buffer missing. The upload middleware must use memory storage when Cloudinary is configured.'
      );
    }

    try {
      const result = await uploadBuffer(
        input.buffer,
        'kodxcamp/recordings',
        'video'
      );
      return { url: result.url, size: result.bytes };
    } catch (err) {
      logger.error('Cloudinary recording upload failed', {
        originalname: input.originalname,
        size: input.size,
        err: err instanceof Error ? err.message : String(err),
      });
      throw new ApiError(502, 'Could not store recording. Try again.');
    }
  },

  async saveMedia(input: RecordingUploadInput): Promise<StoredFile> {
    if (!input.buffer) {
      throw new ApiError(
        500,
        'Media buffer missing. The upload middleware must use memory storage when Cloudinary is configured.'
      );
    }

    try {
      const result = await uploadBuffer(
        input.buffer,
        'kodxcamp/media',
        'auto'
      );
      return { url: result.url, size: result.bytes };
    } catch (err) {
      logger.error('Cloudinary media upload failed', {
        originalname: input.originalname,
        size: input.size,
        err: err instanceof Error ? err.message : String(err),
      });
      throw new ApiError(502, 'Could not store asset. Try again.');
    }
  },

  async deleteByUrl(url: string): Promise<void> {
    // Extract the public ID from the delivery URL.
    // Cloudinary URLs look like:
    //   https://res.cloudinary.com/<cloud>/video/upload/v1234/kodxcamp/recordings/abc.mp4
    // The public ID is everything between `/upload/vNNNN/` and the
    // final extension: `kodxcamp/recordings/abc`.
    const match = url.match(
      /res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)?$/
    );

    if (!match) {
      logger.warn('Could not parse Cloudinary URL for deletion', { url });
      return;
    }

    const publicId = match[1];
    const resourceType = url.includes('/video/upload/')
      ? 'video'
      : url.includes('/raw/upload/')
        ? 'raw'
        : 'image';

    try {
      ensureConfigured();
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
    } catch (err) {
      logger.warn('Cloudinary delete failed; record will still be removed', {
        url,
        publicId,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },

  toAbsoluteUrl(storedUrl: string): string {
    // Cloudinary URLs are already absolute.
    return storedUrl;
  },
};