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

  // ─── Cloudinary (optional) ───────────────────────────────────
  //
  // When CLOUDINARY_CLOUD_NAME is set, the storage layer uses
  // Cloudinary instead of the local `uploads/` directory. Leave
  // blank in development to keep uploads on disk.
  //
  // All three must be set together. Batch 2.2 will add a production
  // sanity check that refuses to boot with a partial Cloudinary
  // configuration, matching the pattern used for Firebase and
  // Razorpay.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // ─── Email ────────────────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_ENABLED: z.coerce.boolean().optional(),

  // ─── Auth ─────────────────────────────────────────────────────
  AUTH_PEPPER: z
    .string()
    .min(32, 'AUTH_PEPPER must be at least 32 characters'),
  SETUP_TOKEN_SECRET: z
    .string()
    .min(32, 'SETUP_TOKEN_SECRET must be at least 32 characters'),

  // ─── Firebase (optional) ──────────────────────────────────────
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // ─── Razorpay (optional) ──────────────────────────────────────
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_MODE: z.enum(['test', 'live']).optional(),

  // ─── AI providers (optional) ──────────────────────────────────
  GROQ_API_KEY: z.string().optional(),

  AI_TEXT_PROVIDER: z.enum(['groq', 'null']).default('null'),
  AI_TEXT_MODEL: z.string().default('openai/gpt-oss-120b'),

  AI_VISION_PROVIDER: z.enum(['groq', 'null']).default('null'),
  AI_VISION_MODEL: z
    .string()
    .default('meta-llama/llama-4-scout-17b-16e-instruct'),

  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  AI_MAX_TOKENS: z.coerce.number().int().positive().max(32768).default(4096),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

/**
 * Is Cloudinary fully configured?
 *
 * True only when all three credentials are present. When false,
 * the storage layer falls back to local disk (development).
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
  );
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      env.RAZORPAY_WEBHOOK_SECRET
  );
}

export function isAITextConfigured(): boolean {
  return Boolean(
    env.AI_TEXT_PROVIDER === 'groq' &&
      env.GROQ_API_KEY &&
      env.AI_TEXT_MODEL
  );
}

export function isAIVisionConfigured(): boolean {
  return Boolean(
    env.AI_VISION_PROVIDER === 'groq' &&
      env.GROQ_API_KEY &&
      env.AI_VISION_MODEL
  );
}

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

  const rzp = [
    env.RAZORPAY_KEY_ID,
    env.RAZORPAY_KEY_SECRET,
    env.RAZORPAY_WEBHOOK_SECRET,
  ];
  const rzpCount = rzp.filter(Boolean).length;
  if (rzpCount > 0 && rzpCount < 3) {
    console.error(
      '❌ Razorpay is partially configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET, or none.'
    );
    process.exit(1);
  }

  // Cloudinary: partial config is a footgun. All three or none.
  // A deployment that sets the cloud name but forgets the secret
  // would silently fall back to local disk, which on Render's
  // ephemeral filesystem means uploads disappear on the next deploy.
  const cld = [
    env.CLOUDINARY_CLOUD_NAME,
    env.CLOUDINARY_API_KEY,
    env.CLOUDINARY_API_SECRET,
  ];
  const cldCount = cld.filter(Boolean).length;
  if (cldCount > 0 && cldCount < 3) {
    console.error(
      '❌ Cloudinary is partially configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET, or none.'
    );
    process.exit(1);
  }

  if (
    (env.AI_TEXT_PROVIDER === 'groq' || env.AI_VISION_PROVIDER === 'groq') &&
    !env.GROQ_API_KEY
  ) {
    console.warn(
      '⚠️  AI_TEXT_PROVIDER or AI_VISION_PROVIDER is set to "groq" but GROQ_API_KEY is not set. AI evaluation will fall back to the null provider.'
    );
  }
}