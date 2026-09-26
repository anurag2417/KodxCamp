import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env, isCloudinaryConfigured } from '../config/env.js';
import { Class as ClassModel } from '../models/Class.model.js';
import { cloudinaryStorageProvider } from '../services/storage/cloudinary.provider.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration: move existing class recordings from local disk
 * to Cloudinary.
 *
 * Context: before Batch 2.3, recordings were written to
 * `server/uploads/recordings/` by multer's disk storage. On Render,
 * that directory lives on the ephemeral filesystem and is wiped on
 * every deploy. New uploads go to Cloudinary as of Batch 2.3; this
 * script brings existing recordings along so they aren't lost the
 * next time the service restarts.
 *
 * Idempotent. Safe to re-run.
 *
 * Behavior:
 *   - Only touches Class documents whose `recording.url` starts with
 *     `/uploads/recordings/`.
 *   - Reads the file from disk, uploads it to Cloudinary, updates the
 *     document with the resulting URL.
 *   - Deletes the local file after a successful update.
 *   - On any per-file failure, records the error and continues.
 *
 * Usage:
 *   npm run migrate:recordings -w server
 */

const RECORDINGS_DIR = path.resolve(process.cwd(), 'uploads', 'recordings');

interface MigrationResult {
  scanned: number;
  migrated: number;
  alreadyCloudinary: number;
  missingOnDisk: number;
  failed: { classId: string; url: string; error: string }[];
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

  console.log('🔧 Migrating class recordings to Cloudinary...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  if (!fs.existsSync(RECORDINGS_DIR)) {
    console.log('   No local recordings directory found - nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const allClasses = await ClassModel.find({
    'recording.url': { $exists: true },
  }).lean();

  const result: MigrationResult = {
    scanned: allClasses.length,
    migrated: 0,
    alreadyCloudinary: 0,
    missingOnDisk: 0,
    failed: [],
  };

  console.log(`   Scanned ${allClasses.length} classes with a recording.`);

  for (const cls of allClasses) {
    const rec = cls.recording;
    if (!rec || !rec.url) continue;

    if (rec.url.startsWith('http')) {
      result.alreadyCloudinary++;
      continue;
    }

    if (!rec.url.startsWith('/uploads/recordings/')) {
      // Unexpected URL shape. Skip and note.
      result.failed.push({
        classId: String(cls._id),
        url: rec.url,
        error: 'URL is not under /uploads/recordings/ and not absolute',
      });
      continue;
    }

    const filename = rec.url.replace('/uploads/recordings/', '');
    const fullPath = path.join(RECORDINGS_DIR, filename);

    if (!fs.existsSync(fullPath)) {
      result.missingOnDisk++;
      logger.warn('Recording missing on disk; skipping', {
        classId: String(cls._id),
        filename,
      });
      continue;
    }

    try {
      const buffer = fs.readFileSync(fullPath);
      const stat = fs.statSync(fullPath);

      const stored = await cloudinaryStorageProvider.saveRecording({
        buffer,
        originalname: filename,
        mimetype: 'video/mp4',
        size: stat.size,
      });

      await ClassModel.updateOne(
        { _id: cls._id },
        {
          $set: {
            'recording.url': stored.url,
            'recording.sizeBytes': stored.size,
          },
        }
      );

      // Remove the local copy now that Cloudinary holds it. Deleting
      // only after a successful DB update — if the update fails, the
      // file stays so we can retry.
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        logger.warn('Could not delete local recording after migration', {
          classId: String(cls._id),
          filename,
          err: err instanceof Error ? err.message : String(err),
        });
      }

      result.migrated++;
      console.log(`   → ${cls.slug}: ${filename} → Cloudinary`);
    } catch (err) {
      result.failed.push({
        classId: String(cls._id),
        url: rec.url,
        error: err instanceof Error ? err.message : String(err),
      });
      logger.error('Recording migration failed for one class', {
        classId: String(cls._id),
        filename,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log('\n─── Migration summary ───');
  console.log(`   Scanned:           ${result.scanned}`);
  console.log(`   Migrated:          ${result.migrated}`);
  console.log(`   Already on Cloudinary: ${result.alreadyCloudinary}`);
  console.log(`   Missing on disk:   ${result.missingOnDisk}`);
  console.log(`   Failed:            ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.log('\n   Failures:');
    for (const f of result.failed) {
      console.log(`     class ${f.classId}: ${f.error}`);
    }
  }

  console.log('\n🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Recordings migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});