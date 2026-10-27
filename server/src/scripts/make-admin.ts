import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.model.js';
import { GLOBAL_PERMISSIONS } from '@kodxcamp/shared';

async function makeAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -w server <email>');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`User with email "${email}" not found.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  user.permissions = [...GLOBAL_PERMISSIONS];
  user.accountStatus = 'active';
  user.emailVerified = true;
  await user.save();

  console.log(
    `✅ Successfully promoted ${user.name || user.email} (${user.email}) to admin.`
  );
  await mongoose.disconnect();
  process.exit(0);
}

makeAdmin().catch(async (err) => {
  console.error('Error promoting user to admin:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

