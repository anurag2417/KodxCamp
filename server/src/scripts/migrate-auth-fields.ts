import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration.
 *
 * Sets `emailVerified: true`, `accountStatus: 'active'`, and
 * `authProvider: 'email'` on every existing user.
 *
 * Without this, every user created before the auth flow was introduced
 * would be locked out - they'd have `emailVerified: false` by schema
 * default, and the login gate would refuse them.
 *
 * Idempotent: safe to re-run.
 */
async function migrate() {
  console.log('🔧 Migrating existing users to the new auth model...');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const result = await User.updateMany(
    {},
    {
      $set: {
        emailVerified: true,
        accountStatus: 'active',
        authProvider: 'email',
      },
    }
  );

  console.log(`✅ Migrated ${result.modifiedCount} user(s)`);
  console.log(
    '   All existing users now have emailVerified=true, accountStatus=active, authProvider=email.'
  );

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});