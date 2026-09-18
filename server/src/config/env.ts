import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars in production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  HMAC_SECRET: z.string().min(32, 'HMAC_SECRET must be at least 32 chars in production'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

// Extra sanity in production
if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET.includes('change_this')) {
    console.error('❌ You must change JWT_SECRET before running in production');
    process.exit(1);
  }
  if (env.HMAC_SECRET.includes('change_this')) {
    console.error('❌ You must change HMAC_SECRET before running in production');
    process.exit(1);
  }
}