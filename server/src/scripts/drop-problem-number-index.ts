import mongoose from 'mongoose';
import { env } from '../config/env.js';

/**
 * One-off cleanup: drop the legacy `number_1` unique index on the
 * `problems` collection.
 *
 * Background: an earlier version of `Problem.model.ts` declared
 * `number` as `unique: true`. The current model marks `number` as
 * deprecated and no longer unique, but MongoDB keeps the old index
 * until it is explicitly dropped. The index causes every seed insert
 * past the first to fail with `E11000 duplicate key ... number: null`,
 * because the seed never sets `number` and Mongo treats missing values
 * as a single `null` for uniqueness purposes.
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   npm run fix:problem-number-index -w server
 */

async function main() {
  console.log('🔧 Dropping legacy number_1 index on problems...');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const coll = mongoose.connection.collection('problems');

  // 1. List all indexes so we can see what's actually there.
  const indexes = await coll.indexes();
  console.log('\nCurrent indexes on problems:');
  for (const idx of indexes) {
    console.log(
      `  ${idx.name}${idx.unique ? ' (unique)' : ''}  ${JSON.stringify(idx.key)}`
    );
  }

  // 2. Drop number_1 if it exists.
  const hasNumberIndex = indexes.some((i) => i.name === 'number_1');
  if (!hasNumberIndex) {
    console.log('\n✅ number_1 index not present — nothing to do.');
  } else {
    await coll.dropIndex('number_1');
    console.log('\n✅ Dropped number_1 index.');
  }

  // 3. Sanity: confirm it's gone.
  const after = await coll.indexes();
  const stillThere = after.some((i) => i.name === 'number_1');
  if (stillThere) {
    console.error('\n❌ number_1 still present after dropIndex. Investigate.');
    process.exit(1);
  }

  console.log('✅ Index list is clean.');
  console.log('\nNow re-run: npm run seed:force -w server\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ Failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});