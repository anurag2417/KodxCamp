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
  //
  // When any of these is missing, the payment routes return 503
  // `payment_not_configured` and the course page falls back to a
  // "Contact admin to enroll" message. The system is designed to be
  // fully deployable without these values set.
  //
  // Get them from https://dashboard.razorpay.com/app/keys and
  // https://dashboard.razorpay.com/app/webhooks
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  /**
   * `test` or `live`. Purely informational — the key pair determines
   * the actual mode. Used to display a banner in the admin UI.
   */
  RAZORPAY_MODE: z.enum(['test', 'live']).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

/**
 * Is Razorpay fully configured?
 *
 * True only when key id, key secret, and webhook secret are all
 * present. Missing webhook secret is a hard failure for the payment
 * flow because we can't verify incoming webhooks without it.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      env.RAZORPAY_WEBHOOK_SECRET
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

  // Razorpay: partial config is a footgun. All three or none.
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
}