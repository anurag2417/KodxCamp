import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Project } from '../models/Project.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for project modes, specifications, and
 * submissions.
 *
 * What it does:
 *
 *   1. Sets `mode: 'required'` on every project missing it. Existing
 *      projects behave as "everyone builds this exact thing" today,
 *      so `required` is the honest default.
 *   2. Sets `specification: {}` on every project missing it.
 *   3. Sets `rubric: []` on every project missing it.
 *   4. Syncs indexes on Project, ProjectSubmission, and UserProject.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:project-modes -w server
 */
async function migrate() {
  console.log('🔧 Migrating projects for modes + specifications...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  // ─── mode ─────────────────────────────────────────────────────
  const modeResult = await Project.updateMany(
    { mode: { $exists: false } },
    { $set: { mode: 'required' } }
  );
  console.log(`   Projects backfilled with mode='required': ${modeResult.modifiedCount}`);

  const modeNullResult = await Project.updateMany(
    { mode: null },
    { $set: { mode: 'required' } }
  );
  if (modeNullResult.modifiedCount > 0) {
    console.log(`   Null modes fixed: ${modeNullResult.modifiedCount}`);
  }

  // ─── specification ────────────────────────────────────────────
  const specResult = await Project.updateMany(
    { specification: { $exists: false } },
    { $set: { specification: {} } }
  );
  console.log(`   Projects backfilled with specification: ${specResult.modifiedCount}`);

  // ─── rubric ───────────────────────────────────────────────────
  const rubricResult = await Project.updateMany(
    { rubric: { $exists: false } },
    { $set: { rubric: [] } }
  );
  console.log(`   Projects backfilled with rubric: ${rubricResult.modifiedCount}`);

  // ─── Index sync ───────────────────────────────────────────────
  console.log('   Syncing Project indexes...');
  await Project.syncIndexes();

  console.log('   Syncing ProjectSubmission indexes...');
  await ProjectSubmission.syncIndexes();

  console.log('   Syncing UserProject indexes...');
  await UserProject.syncIndexes();

  // ─── Sanity counts ────────────────────────────────────────────
  const projectCount = await Project.countDocuments({});
  const submissionCount = await ProjectSubmission.countDocuments({});
  const userProjectCount = await UserProject.countDocuments({});

  console.log(`   Projects: ${projectCount}`);
  console.log(`   Submissions: ${submissionCount}`);
  console.log(`   User project workspaces: ${userProjectCount}`);

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Project modes migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});