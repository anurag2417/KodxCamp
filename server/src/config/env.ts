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
  HMAC_SECRET: z.string().min(32, 'HMAC_SECRET must be at least 32 characters'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Optional: absolute URL for uploads (e.g. Cloudinary / CDN / S3).
  // If unset, falls back to same-origin /uploads/...
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

  const checkSecret = (name: 'JWT_SECRET' | 'HMAC_SECRET', value: string) => {
    const lower = value.toLowerCase();
    const hit = forbidden.find((bad) => lower.includes(bad));
    if (hit) {
      console.error(
        `❌ ${name} contains forbidden substring "${hit}" — refusing to start in production.`
      );
      process.exit(1);
    }
    // Entropy check: at least 16 distinct characters
    if (new Set(value).size < 16) {
      console.error(
        `❌ ${name} has too little entropy (only ${new Set(value).size} distinct characters).`
      );
      process.exit(1);
    }
  };

  checkSecret('JWT_SECRET', env.JWT_SECRET);
  checkSecret('HMAC_SECRET', env.HMAC_SECRET);

  if (env.JWT_SECRET === env.HMAC_SECRET) {
    console.error('❌ JWT_SECRET and HMAC_SECRET must be different.');
    process.exit(1);
  }
}