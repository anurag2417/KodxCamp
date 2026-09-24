/**
 * Firebase Web SDK - lazy initialization.
 *
 * Everything is dynamically imported so the Firebase SDK only loads
 * when the user actually clicks "Continue with Google". The SDK is
 * ~180 kB gzipped; keeping it out of the initial bundle matters on
 * mobile.
 *
 * The four VITE_FIREBASE_* env vars are read at module load (cheap),
 * but the actual SDK import happens inside `getFirebaseAuthClient`.
 */

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as
  | string
  | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as
  | string
  | undefined;
const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(apiKey && authDomain && projectId && appId);
}

type Auth = import('firebase/auth').Auth;

let authPromise: Promise<Auth> | null = null;

export async function getFirebaseAuthClient(): Promise<Auth> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured on the client. Set VITE_FIREBASE_* env vars.'
    );
  }
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ]);

    const app =
      getApps().length === 0
        ? initializeApp({
            apiKey: apiKey!,
            authDomain: authDomain!,
            projectId: projectId!,
            appId: appId!,
          })
        : getApps()[0];

    return getAuth(app);
  })();

  return authPromise;
}