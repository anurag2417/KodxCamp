import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AIEvaluation } from '../models/AIEvaluation.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for AI evaluations.
 *
 * AIEvaluation is a brand-new collection. There is no data to
 * backfill. The only work this script does is:
 *
 *   1. Create the collection (Mongoose does this lazily on first
 *      write, but running `syncIndexes()` here forces it now so the
 *      first evaluation isn't slowed down by index creation).
 *   2. Apply the schema's indexes, including the unique constraint
 *      on `(submissionId, kind, evaluatorVersion, promptVersion)`.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:ai-evaluations -w server
 */
async function migrate() {
  console.log('🔧 Migrating for AI evaluations...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  console.log('   Syncing AIEvaluation indexes...');
  await AIEvaluation.syncIndexes();

  const count = await AIEvaluation.countDocuments({});
  console.log(`   Existing evaluations: ${count}`);

  const indexes = await AIEvaluation.collection.indexes();
  console.log('   Indexes after sync:');
  for (const idx of indexes) {
    console.log(`     ${idx.name} ${JSON.stringify(idx.key)}`);
  }

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('AI evaluations migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});