import { MediaAsset, type MediaKind } from '../models/MediaAsset.model.js';
import { ApiError } from '../utils/ApiError.js';
import { storageService } from './storage.service.js';
import { logger } from '../utils/logger.js';

/**
 * Media library service.
 *
 * Thin orchestration on top of `storage.service.ts`. The storage
 * layer owns the bytes — it decides where files land and returns a
 * public URL. This service owns the *record*: what was uploaded, by
 * whom, with what name, at what size, of what kind.
 *
 * The split is deliberate. If the storage backing changes (local
 * disk → S3, single bucket → CDN), only `storage.service.ts`
 * changes. This file and everything above it stays the same, because
 * they only ever talk about URLs and metadata.
 */

function inferKind(mimeType: string): MediaKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
}

interface StoredFile {
  url: string;
  filename: string;
  sizeBytes: number;
}

export const mediaService = {
  async recordUpload(input: {
    ownerId: string;
    file: {
      originalname: string;
      mimetype: string;
      size: number;
    };
    stored: StoredFile;
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
      sizeBytes: input.stored.sizeBytes,
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
   * Delete an asset. Removes the record and asks the storage layer
   * to delete the file. If the storage delete fails, the record is
   * still removed — a dangling file on disk is a smaller problem
   * than a dangling record that 404s.
   *
   * NAMING DEBT: `storageService.deleteRecording` is the only
   * delete method the storage layer exposes today. It was built for
   * class recordings, but it does what we need — delete a file by
   * its public URL. When the storage service is next touched, add a
   * general-purpose `deleteByUrl` alias and call that instead. The
   * recording-specific name is misleading here.
   */
  async delete(assetId: string) {
    const asset = await MediaAsset.findById(assetId);
    if (!asset) throw new ApiError(404, 'Asset not found');

    try {
      await storageService.deleteRecording(asset.url);
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