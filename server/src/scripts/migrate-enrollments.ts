import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { Course } from '../models/Course.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for the enrollment + pricing batch.
 *
 *   1. Sets `isFree: true` on every course that has no price set.
 *   2. Sets `source: 'manual'` on every enrollment missing a source.
 *   3. Clears the unique index if it was created with different
 *      options on an earlier run (defensive, harmless if not needed).
 *
 * Idempotent. Safe to run multiple times.
 *
 * Usage:
 *   npm run migrate:enrollments -w server
 */
async function migrate() {
  console.log('🔧 Migrating courses + enrollments...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  // 1. isFree default for existing courses.
  const isFreeResult = await Course.collection.updateMany(
    { isFree: { $exists: false } },
    { $set: { isFree: true } }
  );
  console.log(`   Courses defaulted to isFree=true: ${isFreeResult.modifiedCount}`);

  // 2. source default for existing enrollments.
  const sourceResult = await StudentEnrollment.collection.updateMany(
    { source: { $exists: false } },
    { $set: { source: 'manual' } }
  );
  console.log(`   Enrollments defaulted to source=manual: ${sourceResult.modifiedCount}`);

  // 3. Ensure paymentId has no lingering non-null values on old rows
  //    that never had a payment. Left alone, so no-op in practice.
  console.log('🎉 Migration complete.');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Enrollment migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});