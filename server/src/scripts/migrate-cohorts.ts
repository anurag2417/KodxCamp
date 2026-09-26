import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Cohort } from '../models/Cohort.model.js';
import { CohortMembership } from '../models/CohortMembership.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { Class as ClassModel } from '../models/Class.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for cohort support.
 *
 * Cohorts are additive — no existing data needs to be rewritten. This
 * script only ensures the collection indexes match the current
 * schemas. Specifically:
 *
 *   1. Cohort and CohortMembership collections get created with their
 *      indexes on first use (Mongo handles this lazily).
 *   2. StudentEnrollment's indexes are re-synced to include the new
 *      `cohortId` index and preserve the partial unique indexes.
 *   3. Class gets its new `(cohortId, scheduledAt)` compound index.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:cohorts -w server
 */
async function migrate() {
  console.log('🔧 Migrating for cohort support...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  console.log('   Syncing Cohort indexes...');
  await Cohort.syncIndexes();

  console.log('   Syncing CohortMembership indexes...');
  await CohortMembership.syncIndexes();

  console.log('   Syncing StudentEnrollment indexes...');
  await StudentEnrollment.syncIndexes();

  console.log('   Syncing Class indexes...');
  await ClassModel.syncIndexes();

  // Sanity counts.
  const cohortCount = await Cohort.countDocuments({});
  const membershipCount = await CohortMembership.countDocuments({});
  const enrollmentCount = await StudentEnrollment.countDocuments({});

  console.log(`   Cohorts: ${cohortCount}`);
  console.log(`   Cohort memberships: ${membershipCount}`);
  console.log(`   Student enrollments: ${enrollmentCount}`);

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Cohort migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});