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

  // ─── Email ────────────────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_ENABLED: z.coerce.boolean().optional(),

  // ─── Auth ─────────────────────────────────────────────────────
  /**
   * Server-side pepper mixed into every token hash. A DB leak alone
   * cannot be used to brute-force OTPs; an attacker also needs this
   * value. Must be at least 32 characters.
   */
  AUTH_PEPPER: z
    .string()
    .min(32, 'AUTH_PEPPER must be at least 32 characters'),

  /**
   * Short-lived JWT secret for the "set password" step after OTP
   * verification. Separate from JWT_SECRET so a compromise of one
   * doesn't affect the other.
   */
  SETUP_TOKEN_SECRET: z
    .string()
    .min(32, 'SETUP_TOKEN_SECRET must be at least 32 characters'),

  // ─── Firebase (optional until Path B is enabled) ──────────────
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
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

  const checkSecret = (
    name: 'JWT_SECRET' | 'AUTH_PEPPER' | 'SETUP_TOKEN_SECRET',
    value: string
  ) => {
    const lower = value.toLowerCase();
    const hit = forbidden.find((bad) => lower.includes(bad));
    if (hit) {
      console.error(
        `❌ ${name} contains forbidden substring "${hit}" - refusing to start in production.`
      );
      process.exit(1);
    }
    if (new Set(value).size < 16) {
      console.error(
        `❌ ${name} has too little entropy (only ${new Set(value).size} distinct characters).`
      );
      process.exit(1);
    }
  };

  checkSecret('JWT_SECRET', env.JWT_SECRET);
  checkSecret('AUTH_PEPPER', env.AUTH_PEPPER);
  checkSecret('SETUP_TOKEN_SECRET', env.SETUP_TOKEN_SECRET);

  if (env.JWT_SECRET === env.SETUP_TOKEN_SECRET) {
    console.error(
      '❌ JWT_SECRET and SETUP_TOKEN_SECRET must be different.'
    );
    process.exit(1);
  }
  if (env.JWT_SECRET === env.AUTH_PEPPER) {
    console.error('❌ JWT_SECRET and AUTH_PEPPER must be different.');
    process.exit(1);
  }

  // Firebase: if any of the three vars is set, all must be set.
  const fb = [
    env.FIREBASE_PROJECT_ID,
    env.FIREBASE_CLIENT_EMAIL,
    env.FIREBASE_PRIVATE_KEY,
  ];
  const setCount = fb.filter(Boolean).length;
  if (setCount > 0 && setCount < 3) {
    console.error(
      '❌ Firebase is partially configured. Set all three of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or none.'
    );
    process.exit(1);
  }
}