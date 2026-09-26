import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Announcement } from '../models/Announcement.model.js';
import { MediaAsset } from '../models/MediaAsset.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for announcements + media library.
 *
 * Both are brand-new collections. No data to backfill. This script
 * creates the collections and applies their indexes so the first
 * query doesn't pay the index-creation cost.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:announcements-media -w server
 */
async function migrate() {
  console.log('🔧 Migrating for announcements + media library...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  console.log('   Syncing Announcement indexes...');
  await Announcement.syncIndexes();

  console.log('   Syncing MediaAsset indexes...');
  await MediaAsset.syncIndexes();

  console.log(`   Announcements: ${await Announcement.countDocuments({})}`);
  console.log(`   Media assets: ${await MediaAsset.countDocuments({})}`);

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Announcements/media migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});