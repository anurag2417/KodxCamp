import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npm run make-admin -- <email> <password>');
    console.error('Example: npm run make-admin -- admin@example.com "a-very-long-password"');
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('❌ Invalid email address.');
    process.exit(1);
  }

  if (env.NODE_ENV === 'production' && password.length < 16) {
    console.error('❌ In production, password must be at least 16 characters.');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);

  try {
    const hashed = await bcrypt.hash(password, 12);
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: 'Administrator',
        email,
        password: hashed,
        role: 'admin',
      });
      console.log(`✅ Created admin: ${email}`);
    } else {
      user.role = 'admin';
      user.password = hashed;
      await user.save();
      console.log(`✅ Promoted to admin: ${email}`);
    }
  } finally {
    await mongoose.disconnect();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});