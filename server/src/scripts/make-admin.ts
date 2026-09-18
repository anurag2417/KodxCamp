import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';

async function main() {
  const email = process.argv[2] ?? 'admin@kodxcamp.dev';
  const password = process.argv[3] ?? 'admin12345';

  await mongoose.connect(env.MONGODB_URI);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'KodxCamp Admin',
      email,
      password: await bcrypt.hash(password, 12),
      role: 'admin',
    });
    console.log(`✅ Created admin: ${email} / ${password}`);
  } else {
    user.role = 'admin';
    user.password = await bcrypt.hash(password, 12);
    await user.save();
    console.log(`✅ Promoted to admin: ${email} / ${password}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});