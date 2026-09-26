import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { InstructorEvaluation } from '../models/InstructorEvaluation.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for instructor evaluations.
 *
 * InstructorEvaluation is a brand-new collection. There is no data
 * to backfill. This script:
 *
 *   1. Creates the collection.
 *   2. Applies the schema's indexes, including the unique constraint
 *      on `(submissionId, instructorId, revisionNumber)`.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:instructor-evaluations -w server
 */
async function migrate() {
  console.log('🔧 Migrating for instructor evaluations...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  console.log('   Syncing InstructorEvaluation indexes...');
  await InstructorEvaluation.syncIndexes();

  const count = await InstructorEvaluation.countDocuments({});
  console.log(`   Existing reviews: ${count}`);

  const indexes = await InstructorEvaluation.collection.indexes();
  console.log('   Indexes after sync:');
  for (const idx of indexes) {
    console.log(`     ${idx.name} ${JSON.stringify(idx.key)}`);
  }

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Instructor evaluations migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});