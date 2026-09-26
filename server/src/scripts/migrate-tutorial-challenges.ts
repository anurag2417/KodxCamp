import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Lesson } from '../models/Lesson.model.js';
import { Progress } from '../models/Progress.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for tutorial challenges.
 *
 * Challenges are additive — no existing data needs to be rewritten.
 * The only changes this migration makes are:
 *
 *   1. Backfills `tutorialChallenges: []` on any lesson missing the
 *      field (Mongoose defaults handle new writes; this handles the
 *      read of old documents via the read paths, but a null value in
 *      the DB can still leak through `$unset` operations or direct
 *      writes).
 *   2. Backfills `completedChallenges: {}` on any progress document
 *      missing the field, for the same reason.
 *   3. Syncs indexes on both collections.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:tutorial-challenges -w server
 */
async function migrate() {
  console.log('🔧 Migrating for tutorial challenges...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  // ─── Lesson.tutorialChallenges ───────────────────────────────
  const lessonResult = await Lesson.updateMany(
    { tutorialChallenges: { $exists: false } },
    { $set: { tutorialChallenges: [] } }
  );
  console.log(
    `   Lessons backfilled with tutorialChallenges: ${lessonResult.modifiedCount}`
  );

  // Null values (from an earlier $unset) also need fixing.
  const lessonNullResult = await Lesson.updateMany(
    { tutorialChallenges: null },
    { $set: { tutorialChallenges: [] } }
  );
  if (lessonNullResult.modifiedCount > 0) {
    console.log(
      `   Null tutorialChallenges fixed: ${lessonNullResult.modifiedCount}`
    );
  }

  // ─── Progress.completedChallenges ────────────────────────────
  const progressResult = await Progress.updateMany(
    { completedChallenges: { $exists: false } },
    { $set: { completedChallenges: {} } }
  );
  console.log(
    `   Progress docs backfilled with completedChallenges: ${progressResult.modifiedCount}`
  );

  const progressNullResult = await Progress.updateMany(
    { completedChallenges: null },
    { $set: { completedChallenges: {} } }
  );
  if (progressNullResult.modifiedCount > 0) {
    console.log(
      `   Null completedChallenges fixed: ${progressNullResult.modifiedCount}`
    );
  }

  // ─── Index sync ──────────────────────────────────────────────
  console.log('   Syncing Lesson indexes...');
  await Lesson.syncIndexes();

  console.log('   Syncing Progress indexes...');
  await Progress.syncIndexes();

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Tutorial challenges migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});