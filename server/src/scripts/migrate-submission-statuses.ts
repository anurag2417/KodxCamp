import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot audit of ProjectSubmission statuses.
 *
 * The `ProjectSubmissionStatus` enum was defined with all six values
 * from the start, so in practice this is expected to be a no-op. It
 * exists as a safety net: if any document ever ended up with a status
 * not in the current enum — from a manual DB write, a buggy batch, or
 * an older schema — this script reports it rather than silently
 * ignoring the problem.
 *
 * It does NOT change any documents. It only reports. Auto-correcting
 * a bad status would hide the bug that produced it.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:submission-statuses -w server
 */
async function migrate() {
  console.log('🔧 Auditing ProjectSubmission statuses...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const VALID = [
    'submitted',
    'ai_evaluated',
    'instructor_reviewed',
    'passed',
    'needs_improvement',
    'resubmission_requested',
  ];

  const total = await ProjectSubmission.countDocuments({});
  console.log(`   Total submissions: ${total}`);

  const invalid = await ProjectSubmission.find({
    status: { $nin: VALID },
  })
    .select('_id status')
    .lean();

  if (invalid.length === 0) {
    console.log('   ✅ Every submission has a valid status.');
  } else {
    console.log(
      `   ⚠️  ${invalid.length} submission(s) have invalid statuses:`,
    );
    for (const doc of invalid) {
      console.log(`     ${doc._id} → "${doc.status}"`);
    }
    console.log(
      '   These are NOT auto-corrected. Investigate the source before fixing.',
    );
  }

  const breakdown = await ProjectSubmission.aggregate<{
    _id: string;
    count: number;
  }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

  console.log('   Status breakdown:');
  if (breakdown.length === 0) {
    console.log('     (no submissions)');
  } else {
    for (const row of breakdown) {
      console.log(`     ${row._id}: ${row.count}`);
    }
  }

  console.log('🎉 Audit complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Submission statuses audit failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});