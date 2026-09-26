import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Project } from '../models/Project.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for project tests + test runs.
 *
 * What it does:
 *
 *   1. Backfills `tests: []` on every project missing the field.
 *      Existing projects start with no automated tests — the author
 *      adds them via the admin editor when they're ready.
 *   2. Syncs indexes on Project and ProjectSubmission.
 *
 * Existing submissions are untouched. They simply have no `testRun`
 * or `screenshots` — the type marks them optional for exactly this
 * reason.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:project-tests -w server
 */
async function migrate() {
  console.log('🔧 Migrating projects for automated tests...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const testsResult = await Project.updateMany(
    { tests: { $exists: false } },
    { $set: { tests: [] } }
  );
  console.log(`   Projects backfilled with tests: ${testsResult.modifiedCount}`);

  const testsNullResult = await Project.updateMany(
    { tests: null },
    { $set: { tests: [] } }
  );
  if (testsNullResult.modifiedCount > 0) {
    console.log(`   Null tests fixed: ${testsNullResult.modifiedCount}`);
  }

  console.log('   Syncing Project indexes...');
  await Project.syncIndexes();

  console.log('   Syncing ProjectSubmission indexes...');
  await ProjectSubmission.syncIndexes();

  const projectCount = await Project.countDocuments({});
  const submissionCount = await ProjectSubmission.countDocuments({});
  const projectsWithTests = await Project.countDocuments({
    'tests.0': { $exists: true },
  });

  console.log(`   Projects: ${projectCount}`);
  console.log(`   Projects with tests: ${projectsWithTests}`);
  console.log(`   Submissions: ${submissionCount}`);

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Project tests migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});