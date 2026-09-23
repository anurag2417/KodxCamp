import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Course } from '../models/Course.model.js';
import { User } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot, idempotent migration.
 *
 * Brings pre-RBAC Course documents in line with the current schema:
 *   1. `members` missing or null → `[]`
 *   2. `createdBy` missing or empty → the first admin user's id
 *
 * Safe to re-run. The second run reports 0 modified.
 *
 * Usage:
 *   npm run migrate:rbac -w server
 */
async function migrate() {
  console.log('🔧 Migrating courses for RBAC...');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  // Resolve the fallback admin once, only if we need it.
  let fallbackAdminId: string | null = null;
  const needFallbackCheck = await Course.countDocuments({
    $or: [
      { createdBy: { $exists: false } },
      { createdBy: '' },
      { createdBy: null },
    ],
  });

  if (needFallbackCheck > 0) {
    const admin = await User.findOne({ role: 'admin' })
      .select('_id')
      .lean();
    if (!admin) {
      console.error(
        '❌ No admin user exists. Run `npm run make-admin` first, then re-run this migration.'
      );
      await mongoose.disconnect();
      process.exit(1);
    }
    fallbackAdminId = admin._id.toString();
    console.log(`   Fallback admin: ${fallbackAdminId}`);
  }

  // 1. Fill in `members` where it's missing or null.
  const membersResult = await Course.updateMany(
    { $or: [{ members: { $exists: false } }, { members: null }] },
    { $set: { members: [] } }
  );

  // 2. Fill in `createdBy` where it's missing or empty.
  let createdByResult = { modifiedCount: 0 };
  if (fallbackAdminId) {
    createdByResult = await Course.updateMany(
      {
        $or: [
          { createdBy: { $exists: false } },
          { createdBy: '' },
          { createdBy: null },
        ],
      },
      { $set: { createdBy: fallbackAdminId } }
    );
  }

  console.log(`✅ members initialized on ${membersResult.modifiedCount} course(s)`);
  console.log(
    `✅ createdBy backfilled on ${createdByResult.modifiedCount} course(s)`
  );

  const totalModified =
    membersResult.modifiedCount + createdByResult.modifiedCount;

  if (totalModified === 0) {
    console.log('   Nothing to do — already migrated.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('RBAC migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});