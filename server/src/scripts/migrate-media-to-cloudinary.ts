import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env, isCloudinaryConfigured } from '../config/env.js';
import { MediaAsset } from '../models/MediaAsset.model.js';
import { cloudinaryStorageProvider } from '../services/storage/cloudinary.provider.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration: move existing media library assets from local
 * disk to Cloudinary.
 *
 * Context: before Batch 2.4, media uploads were written to
 * `server/uploads/media/` by multer's disk storage. On Render, that
 * directory lives on the ephemeral filesystem and is wiped on every
 * deploy. New uploads go to Cloudinary as of Batch 2.4; this script
 * brings existing assets along so they aren't lost.
 *
 * Idempotent. Safe to re-run.
 *
 * Behavior:
 *   - Only touches MediaAsset documents whose `url` starts with
 *     `/uploads/media/`.
 *   - Reads the file from disk, uploads it to Cloudinary, updates the
 *     document with the resulting URL and size.
 *   - Deletes the local file after a successful update.
 *   - On any per-file failure, records the error and continues.
 *
 * Usage:
 *   npm run migrate:media -w server
 */

const MEDIA_DIR = path.resolve(process.cwd(), 'uploads', 'media');

interface MigrationResult {
  scanned: number;
  migrated: number;
  alreadyCloudinary: number;
  missingOnDisk: number;
  failed: { assetId: string; url: string; error: string }[];
}

function inferMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mov':
      return 'video/quicktime';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

async function migrate(): Promise<void> {
  if (!isCloudinaryConfigured()) {
    console.error(
      '❌ Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, ' +
        'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before running ' +
        'this migration.'
    );
    process.exit(1);
  }

  console.log('🔧 Migrating media library assets to Cloudinary...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  if (!fs.existsSync(MEDIA_DIR)) {
    console.log('   No local media directory found - nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const allAssets = await MediaAsset.find({
    url: { $regex: '^/uploads/media/' },
  }).lean();

  const totalAssets = await MediaAsset.countDocuments({});

  const result: MigrationResult = {
    scanned: allAssets.length,
    migrated: 0,
    alreadyCloudinary: totalAssets - allAssets.length,
    missingOnDisk: 0,
    failed: [],
  };

  console.log(
    `   Scanned ${allAssets.length} assets with a local URL ` +
      `(${result.alreadyCloudinary} already on Cloudinary).`
  );

  for (const asset of allAssets) {
    const filename = asset.url.replace('/uploads/media/', '');
    const fullPath = path.join(MEDIA_DIR, filename);

    if (!fs.existsSync(fullPath)) {
      result.missingOnDisk++;
      logger.warn('Media asset missing on disk; skipping', {
        assetId: String(asset._id),
        filename,
      });
      continue;
    }

    try {
      const buffer = fs.readFileSync(fullPath);
      const stat = fs.statSync(fullPath);

      const stored = await cloudinaryStorageProvider.saveMedia({
        buffer,
        originalname: asset.originalName || filename,
        mimetype: asset.mimeType || inferMimeType(filename),
        size: stat.size,
      });

      await MediaAsset.updateOne(
        { _id: asset._id },
        {
          $set: {
            url: stored.url,
            sizeBytes: stored.size,
          },
        }
      );

      // Remove the local copy now that Cloudinary holds it.
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        logger.warn('Could not delete local media file after migration', {
          assetId: String(asset._id),
          filename,
          err: err instanceof Error ? err.message : String(err),
        });
      }

      result.migrated++;
      console.log(
        `   → ${asset.originalName}: ${filename} → Cloudinary`
      );
    } catch (err) {
      result.failed.push({
        assetId: String(asset._id),
        url: asset.url,
        error: err instanceof Error ? err.message : String(err),
      });
      logger.error('Media asset migration failed for one asset', {
        assetId: String(asset._id),
        filename,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log('\n─── Migration summary ───');
  console.log(`   Scanned:              ${result.scanned}`);
  console.log(`   Migrated:             ${result.migrated}`);
  console.log(`   Already on Cloudinary: ${result.alreadyCloudinary}`);
  console.log(`   Missing on disk:      ${result.missingOnDisk}`);
  console.log(`   Failed:               ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.log('\n   Failures:');
    for (const f of result.failed) {
      console.log(`     asset ${f.assetId}: ${f.error}`);
    }
  }

  console.log('\n🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Media migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});