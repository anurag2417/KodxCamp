import mongoose from 'mongoose';
import { env } from '../config/env.js';
//import { Invitation } from '../models/Invitation.model.js';

/**
 * One-off migration for invitations that predate the 2D taxonomy
 * rollout and still carry `author` or `reviewer` roles.
 *
 * Runs a direct MongoDB update bypassing Mongoose validation,
 * because Mongoose would reject the legacy values as soon as we
 * try to load them for inspection.
 *
 *   npm run migrate:invitation-roles -w server
 *
 * The mapping:
 *   author   -> course_author
 *   reviewer -> viewer
 *
 * Any other value in the `role` field is left untouched; those are
 * reported so a human can decide.
 *
 * Idempotent.
 */

const LEGACY_MAP: Record<string, string> = {
  author: 'course_author',
  reviewer: 'viewer',
};

const VALID = [
  'lead',
  'course_author',
  'problem_author',
  'class_coordinator',
  'ta',
  'viewer',
];

async function main() {
  console.log('🔧 Migrating invitation roles...');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const coll = mongoose.connection.collection('invitations');

  // Find any row whose role isn't in the modern set.
  const stale = await coll
    .find({ role: { $nin: VALID } })
    .project<{ _id: mongoose.Types.ObjectId; role: string }>({
      _id: 1,
      role: 1,
    })
    .toArray();

  if (stale.length === 0) {
    console.log('✅ No stale invitations. Nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${stale.length} invitation(s) with legacy roles.`);

  let migrated = 0;
  const unknown: string[] = [];

  for (const row of stale) {
    const next = LEGACY_MAP[row.role];
    if (!next) {
      unknown.push(`${row._id.toString()} -> "${row.role}"`);
      continue;
    }
    await coll.updateOne(
      { _id: row._id },
      { $set: { role: next } }
    );
    migrated++;
  }

  console.log(`✅ Migrated ${migrated} invitation(s).`);
  if (unknown.length > 0) {
    console.log('\n⚠️  The following invitations have roles not in the map:');
    for (const u of unknown) console.log(`  ${u}`);
    console.log('Review these manually.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ Migration failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});