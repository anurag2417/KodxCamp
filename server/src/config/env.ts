import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z
    .string()
    .default('http://localhost:5173')
    .transform((s) => s.split(',').map((u) => u.trim()).filter(Boolean))
    .pipe(z.array(z.string().url())),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PUBLIC_UPLOAD_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

// ─── Production secret sanity ──────────────────────────────────────
if (env.NODE_ENV === 'production') {
  const forbidden = [
    'change_this',
    'replace_this',
    'your_secret',
    'your-secret',
    'example',
    'placeholder',
    'test',
    'secret',
    'password',
    'changeme',
  ];

  const lower = env.JWT_SECRET.toLowerCase();
  const hit = forbidden.find((bad) => lower.includes(bad));
  if (hit) {
    console.error(
      `❌ JWT_SECRET contains forbidden substring "${hit}" — refusing to start in production.`
    );
    process.exit(1);
  }
  if (new Set(env.JWT_SECRET).size < 16) {
    console.error(
      `❌ JWT_SECRET has too little entropy (only ${new Set(env.JWT_SECRET).size} distinct characters).`
    );
    process.exit(1);
  }
}