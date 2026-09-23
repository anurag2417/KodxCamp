import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Firebase Admin SDK initialization.
 *
 * Lazy: the SDK is only initialized the first time a Google sign-in
 * attempt reaches the server. If `FIREBASE_*` env vars are missing,
 * initialization fails and the middleware refuses Google routes with
 * a clear 503, rather than crashing the process on boot.
 *
 * The private key is stored in env as a single string with literal
 * `\n` escapes (the format Firebase's console produces). We convert
 * those back to real newlines before passing it to the SDK.
 *
 * NOTE ON IMPORTS: firebase-admin v12+ exposes named exports from
 * subpaths (`firebase-admin/app`, `firebase-admin/auth`) instead of a
 * single default namespace. The default import was removed.
 */
let initialized = false;
let initError: Error | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY
  );
}

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  if (!initialized) {
    try {
      const existingApps: App[] = getApps();
      if (existingApps.length === 0) {
        initializeApp({
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID!,
            clientEmail: env.FIREBASE_CLIENT_EMAIL!,
            privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
          }),
        });
        logger.info('Firebase Admin SDK initialized', {
          projectId: env.FIREBASE_PROJECT_ID,
        });
      }
      initialized = true;
    } catch (err) {
      initError = err instanceof Error ? err : new Error(String(err));
      logger.error('Firebase Admin SDK initialization failed', {
        err: initError.message,
      });
      throw initError;
    }
  }

  return getAuth();
}