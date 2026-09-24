import { getFirebaseAuth } from './firebase.service.js';
import { User, type UserDocument, type AuthProvider } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { activityService } from './activity.service.js';
import { logger } from '../utils/logger.js';

export interface GoogleSignInResult {
  user: UserDocument;
  isNewUser: boolean;
}

/**
 * Verify a Firebase ID token and either sign in, link, or create a
 * user. This is the only place that touches Google identity - the
 * controller stays thin.
 *
 * Matching is by email, always. A user who registered via email/OTP
 * and later clicks "Continue with Google" with the same email is
 * linked, not duplicated.
 */
export const googleAuthService = {
  async signIn(idToken: string): Promise<GoogleSignInResult> {
    if (!idToken || typeof idToken !== 'string') {
      throw new ApiError(400, 'Missing Firebase ID token.');
    }

    // 1. Verify the token with Firebase. This checks signature,
    //    audience, issuer, and expiry. Anything invalid throws.
    let decoded: Awaited<ReturnType<ReturnType<typeof getFirebaseAuth>['verifyIdToken']>>;
    try {
      decoded = await getFirebaseAuth().verifyIdToken(idToken);
    } catch (err) {
      logger.warn('Firebase ID token verification failed', {
        err: err instanceof Error ? err.message : String(err),
      });
      throw new ApiError(401, 'Invalid Google sign-in token.');
    }

    const email = decoded.email?.toLowerCase().trim();
    if (!email) {
      throw new ApiError(
        400,
        'Your Google account has no email address attached.'
      );
    }

    // Only trust Google-verified emails. Firebase's `email_verified`
    // is normally true for Google accounts, but if it isn't, we
    // refuse rather than hand out an account on an unverified email.
    if (decoded.email_verified !== true) {
      throw new ApiError(
        403,
        'Your Google email is not verified. Please verify it with Google first.'
      );
    }

    const googleId = decoded.uid;
    const displayName =
      typeof decoded.name === 'string' && decoded.name.trim()
        ? decoded.name.trim()
        : email.split('@')[0];

    // 2. Look up existing user by email.
    let user = await User.findOne({ email }).select('+password');

    if (!user) {
      // 2a. Brand new user - create with Google as the provider.
      user = await User.create({
        email,
        name: displayName,
        googleId,
        emailVerified: true,
        accountStatus: 'active',
        authProvider: 'google',
      });

      logger.info('New user created via Google', {
        userId: user._id.toString(),
        email,
      });

      await activityService.record({
        userId: user._id.toString(),
        type: 'login',
        xp: 0,
      });

      return { user, isNewUser: true };
    }

    // 2b. Existing user. Check for suspended first.
    if (user.accountStatus === 'suspended') {
      throw new ApiError(403, 'This account is suspended.');
    }

    // 2c. If the account was mid-email-signup, upgrade it now. The
    //     user proved ownership of the email via Google, so we can
    //     skip the OTP step entirely.
    const wasMidSignup =
      user.accountStatus === 'pending_verification' ||
      user.accountStatus === 'pending_profile';

    if (wasMidSignup) {
      user.emailVerified = true;
      user.accountStatus = 'active';
    }

    // 2d. Update the provider. If they already had a password, they
    //     become `both`; if not, they were a Google-only user or a
    //     pending email signup with no password yet - either way,
    //     `google` is a subset. Set to `both` only when a password
    //     exists.
    const hasPassword = Boolean(user.password);
    const nextProvider: AuthProvider = hasPassword ? 'both' : 'google';
    user.authProvider = nextProvider;

    // 2e. Store the Google UID. If it changed (rare - Google almost
    //     never rotates UIDs) or was absent, update it.
    if (user.googleId !== googleId) {
      user.googleId = googleId;
    }

    // 2f. Fill in a name if the account still has none. Do NOT
    //     overwrite an existing name.
    if (!user.name || !user.name.trim()) {
      user.name = displayName;
    }

    user.lastActiveAt = new Date();
    await user.save();

    await activityService.record({
      userId: user._id.toString(),
      type: 'login',
      xp: 0,
    });

    return { user, isNewUser: false };
  },
};