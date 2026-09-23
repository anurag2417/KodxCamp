import { getFirebaseAuthClient } from './firebase';

/**
 * Opens the Google sign-in popup and returns the Firebase ID token.
 *
 * Firebase is loaded dynamically, so the first call downloads the SDK.
 * Subsequent calls reuse the cached auth instance.
 */
export async function getGoogleIdToken(): Promise<string> {
  const [
    { GoogleAuthProvider, signInWithPopup, signOut: firebaseSignOut },
    auth,
  ] = await Promise.all([
    import('firebase/auth'),
    getFirebaseAuthClient(),
  ]);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let result;
  try {
    result = await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    switch (code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        throw new Error('Sign-in was cancelled.');
      case 'auth/popup-blocked':
        throw new Error(
          'Your browser blocked the sign-in popup. Allow popups for this site and try again.'
        );
      case 'auth/network-request-failed':
        throw new Error(
          'Network error while contacting Google. Check your connection and try again.'
        );
      default:
        throw new Error(
          'Google sign-in could not be completed. Please try again.'
        );
    }
  }

  const idToken = await result.user.getIdToken();
  await firebaseSignOut(auth);
  return idToken;
}