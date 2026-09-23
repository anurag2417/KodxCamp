import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

/**
 * Promote or create an admin user.
 *
 * Usage:
 *   npm run make-admin -w server -- email@example.com mypassword123
 *
 * Upserts: if the user exists, promotes them to admin and resets
 * their password. If not, creates the account with role='admin'.
 *
 * This is the escape hatch for "I locked myself out of the admin
 * panel" and the bootstrap path in `seed.ts` (which refuses to run
 * in production without an existing admin).
 */
async function makeAdmin() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      'Usage: npm run make-admin -w server -- email@example.com password'
    );
    process.exit(1);
  }

  const normalized = email.toLowerCase().trim();

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
  }

  console.log(`🔧 Making ${normalized} an admin...`);

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email: normalized });

  if (existing) {
    existing.role = 'admin';
    existing.password = passwordHash;
    existing.emailVerified = true;
    existing.accountStatus = 'active';
    // Preserve authProvider if they were already linked to Google.
    if (existing.authProvider === 'google') {
      existing.authProvider = 'both';
    } else if (existing.authProvider !== 'both') {
      existing.authProvider = 'email';
    }
    await existing.save();
    console.log(`✅ Promoted existing user ${normalized} to admin.`);
    console.log('   Password has been reset.');
  } else {
    await User.create({
      email: normalized,
      name: 'Admin',
      password: passwordHash,
      role: 'admin',
      emailVerified: true,
      accountStatus: 'active',
      authProvider: 'email',
    });
    console.log(`✅ Created new admin: ${normalized}`);
  }

  console.log('\n🎉 Done. Log in with the credentials you provided.');
  await mongoose.disconnect();
  process.exit(0);
}

makeAdmin().catch(async (err) => {
  logger.error('make-admin failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});