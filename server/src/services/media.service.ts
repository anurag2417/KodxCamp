import { MediaAsset, type MediaKind } from '../models/MediaAsset.model.js';
import { ApiError } from '../utils/ApiError.js';
import { storageService } from './storage/index.js';
import { logger } from '../utils/logger.js';

/**
 * Media library service.
 *
 * Thin orchestration on top of the storage façade. The storage layer
 * owns the bytes — it decides where files land and returns a public
 * URL. This service owns the *record*: what was uploaded, by whom,
 * with what name, at what size, of what kind.
 *
 * The split is deliberate. If the storage backing changes (local
 * disk → S3 → Cloudinary), only the storage provider changes. This
 * file and everything above it stays the same, because they only ever
 * talk about URLs and metadata.
 *
 * As of Batch 2.4, the media controller uploads through the storage
 * façade first and passes the resulting `stored` record here. This
 * service no longer knows or cares whether the bytes are on disk or
 * on Cloudinary — it just persists the metadata.
 */

function inferKind(mimeType: string): MediaKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
}

/**
 * The shape this service expects for a stored file.
 *
 * Matches the `StoredFile` returned by the storage façade
 * (`{ url, size }`). Named locally so the service has a single
 * authoritative shape and a single place to change if the façade's
 * return type ever evolves.
 */
interface StoredFileRef {
  url: string;
  size: number;
}

export const mediaService = {
  /**
   * Record an uploaded asset.
   *
   * The caller uploads through the storage façade first and passes
   * the resulting `stored` record here.
   */
  async recordUpload(input: {
    ownerId: string;
    file: {
      originalname: string;
      mimetype: string;
      size: number;
    };
    stored: StoredFileRef;
    thumbUrl?: string;
    width?: number;
    height?: number;
    durationSec?: number;
  }) {
    const kind = inferKind(input.file.mimetype);

    const created = await MediaAsset.create({
      ownerId: input.ownerId,
      kind,
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
      sizeBytes: input.stored.size,
      url: input.stored.url,
      thumbUrl: input.thumbUrl,
      width: input.width,
      height: input.height,
      durationSec: input.durationSec,
    });

    return created.toObject();
  },

  async listForOwner(
    ownerId: string,
    opts: { kind?: MediaKind; page?: number; limit?: number } = {},
  ) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { ownerId };
    if (opts.kind) query.kind = opts.kind;

    const [rows, total] = await Promise.all([
      MediaAsset.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MediaAsset.countDocuments(query),
    ]);

    return {
      assets: rows.map((r) => ({ ...r, _id: String(r._id) })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  },

  async listAll(
    opts: { kind?: MediaKind; page?: number; limit?: number } = {},
  ) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (opts.kind) query.kind = opts.kind;

    const [rows, total] = await Promise.all([
      MediaAsset.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MediaAsset.countDocuments(query),
    ]);

    return {
      assets: rows.map((r) => ({ ...r, _id: String(r._id) })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  },

  async getById(assetId: string) {
    const asset = await MediaAsset.findById(assetId).lean();
    if (!asset) throw new ApiError(404, 'Asset not found');
    return { ...asset, _id: String(asset._id) };
  },

  /**
   * Delete an asset. Removes the record and asks the storage façade
   * to delete the file.
   *
   * Best-effort on the storage delete: never throws on a failed
   * underlying delete. A dangling file in Cloudinary is a smaller
   * problem than a dangling record that 404s.
   */
  async delete(assetId: string) {
    const asset = await MediaAsset.findById(assetId);
    if (!asset) throw new ApiError(404, 'Asset not found');

    try {
      await storageService.deleteByUrl(asset.url);
    } catch (err) {
      logger.warn('Media file delete failed; record will still be removed', {
        assetId,
        url: asset.url,
        err: err instanceof Error ? err.message : String(err),
      });
    }

    await MediaAsset.deleteOne({ _id: asset._id });
    return { ok: true };
  },
};