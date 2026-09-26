import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for roadmap enrollment support.
 *
 * What it does:
 *   1. Drops the old non-partial unique indexes on StudentEnrollment
 *      (`userId_1_courseId_1`). They blocked the new schema's partial
 *      indexes from being the only uniqueness guard.
 *   2. Relies on Mongoose's autoIndex to recreate the partial indexes
 *      on next server boot, OR creates them explicitly if autoIndex is
 *      off (production).
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:roadmap-enrollment -w server
 */
async function migrate() {
  console.log('🔧 Migrating StudentEnrollment for roadmap support...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const collection = StudentEnrollment.collection;

  // ─── List existing indexes ────────────────────────────────────
  const before = await collection.indexes();
  console.log('   Existing indexes:');
  for (const idx of before) {
    console.log(`     ${idx.name} ${JSON.stringify(idx.key)}`);
  }

  // ─── Drop the old unique index on (userId, courseId) ──────────
  //
  // The index is named `userId_1_courseId_1` by Mongo convention.
  // We drop it by name so we don't accidentally remove something else
  // if the user has custom indexes.
  const oldIndexName = 'userId_1_courseId_1';
  const hasOldIndex = before.some((idx) => idx.name === oldIndexName);

  if (hasOldIndex) {
    console.log(`   Dropping old index: ${oldIndexName}`);
    await collection.dropIndex(oldIndexName);
    console.log('   ✅ Dropped');
  } else {
    console.log(`   Old index ${oldIndexName} not present — nothing to drop.`);
  }

  // ─── Sanity count after ───────────────────────────────────────
  const totalEnrollments = await collection.countDocuments({});
  console.log(`   Enrollments in collection: ${totalEnrollments}`);

  // ─── Ensure the partial indexes exist ─────────────────────────
  //
  // In dev, Mongoose autoIndex will recreate the partial indexes on
  // next boot. In production (autoIndex: false) we create them now.
  //
  // We call `.syncIndexes()` which drops indexes not in the schema
  // and creates indexes that are. It's the safe, idempotent primitive.
  console.log('   Syncing indexes to current schema...');
  await StudentEnrollment.syncIndexes();

  const after = await collection.indexes();
  console.log('   Indexes after sync:');
  for (const idx of after) {
    console.log(`     ${idx.name} ${JSON.stringify(idx.key)}`);
  }

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Roadmap enrollment migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});