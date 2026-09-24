import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Course } from '../models/Course.model.js';
import { CourseMembership } from '../models/CourseMembership.model.js';
import { courseMembershipService } from '../services/courseMembership.service.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for the Course.members[] -> CourseMembership
 * transition.
 *
 * Steps:
 *   1. Backfill CourseMembership from any course that still has a
 *      legacy `members[]` array.
 *   2. Ensure every course has a `lead` membership for its creator.
 *   3. $unset the `members` field on every course.
 *
 * Idempotent. Safe to run multiple times. Once `members` is unset,
 * step 1 is a no-op.
 */
async function migrate() {
  console.log('🔧 Migrating Course.members[] -> CourseMembership...');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const before = await CourseMembership.countDocuments({});
  console.log(`   CourseMembership rows before: ${before}`);

  // Step 1: backfill from any course that still has a members array.
  const result = await courseMembershipService.syncFromLegacyMembers();
  console.log(`   Legacy courses scanned: ${result.coursesScanned}`);
  console.log(`   Memberships written from legacy: ${result.membershipsWritten}`);
  if (result.errors.length > 0) {
    console.log(`   ⚠️  Legacy errors: ${result.errors.length}`);
    for (const e of result.errors.slice(0, 20)) {
      console.log(`      - course ${e.courseId}: ${e.error}`);
    }
  }

  // Step 2: ensure a `lead` row per creator.
  const courses = await Course.find({}).select('_id createdBy').lean();

  let creatorRowsWritten = 0;
  for (const course of courses) {
    if (!course.createdBy) continue;
    const existing = await CourseMembership.findOne({
      userId: course.createdBy,
      courseId: course._id.toString(),
    }).lean();
    if (existing) continue;

    await courseMembershipService.upsert({
      userId: course.createdBy,
      courseId: course._id.toString(),
      role: 'lead',
      addedBy: course.createdBy,
    });
    creatorRowsWritten++;
  }
  console.log(`   Creator lead rows written: ${creatorRowsWritten}`);

  // Step 3: drop the legacy `members` field.
  const unsetResult = await Course.collection.updateMany(
    { members: { $exists: true } },
    { $unset: { members: '' } }
  );
  console.log(`   Courses with members unset: ${unsetResult.modifiedCount}`);

  const after = await CourseMembership.countDocuments({});
  console.log(`✅ CourseMembership rows after: ${after}`);

  if (result.errors.length === 0) {
    console.log('🎉 Migration complete.');
  } else {
    console.log('⚠️  Migration completed with errors. See above.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Membership migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});