import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { AuthField } from '../components/AuthField';
import { Seo } from '../../../shared/components/seo/Seo';
import { authApi } from '../api';
import { useAuthStore } from '../../../shared/store/auth.store';
import { isFirebaseConfigured } from '../lib/firebase';
import { getGoogleIdToken } from '../lib/googleSignIn';
import { resolveNext, withNext } from '../lib/redirect';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const navigate = useNavigate();

  /**
   * The destination the user was trying to reach before being sent to
   * login. Validated by `resolveNext`, which rejects anything that
   * isn't an in-app absolute path.
   */
  const next = resolveNext(searchParams.toString());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(next, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data as
          | {
              reason?: string;
              data?: { email?: string; setupToken?: string };
              message?: string;
            }
          | undefined;

        // Both intermediate hops carry `next` forward so the user
        // lands where they were heading after completing them.
        if (body?.reason === 'email_unverified') {
          const verifyPath = `/signup/verify?email=${encodeURIComponent(
            body.data?.email ?? email
          )}`;
          navigate(withNext(verifyPath, next));
          return;
        }
        if (body?.reason === 'profile_incomplete' && body.data?.setupToken) {
          const setupPath = `/signup/setup?setupToken=${encodeURIComponent(
            body.data.setupToken
          )}`;
          navigate(withNext(setupPath, next));
          return;
        }
        setError(body?.message ?? 'Invalid email or password');
      } else {
        setError('Invalid email or password');
      }
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleBusy(true);
    try {
      const idToken = await getGoogleIdToken();
      await loginWithGoogle(idToken);
      navigate(next, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err instanceof Error) {
        setError(err.message || 'Google sign-in was cancelled.');
      } else {
        setError('Google sign-in failed.');
      }
      setGoogleBusy(false);
    }
  };

  const googleEnabled = isFirebaseConfigured();

  return (
    <>
      <Seo
        title="Login"
        description="Sign in to KodxCamp and continue your learning journey."
      />
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to continue where you left off."
        footer={
          <>
            New to KodxCamp?{' '}
            <Link
              to={withNext('/signup', next)}
              className="font-medium text-brand-500 hover:underline"
            >
              Create a free account
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {googleEnabled && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleBusy || busy}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-5 py-3.5 text-sm font-semibold text-text-primary transition-all duration-200 hover:bg-surface-secondary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {googleBusy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-bg px-3 text-text-muted">or</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthField
              label="Email"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={!googleEnabled}
            />

            <AuthField
              label="Password"
              icon={Lock}
              type="password"
              isPassword
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="-mt-2 text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-brand-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="auth-shake rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3.5 py-2.5 text-sm font-medium text-[var(--color-error)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || googleBusy}
              className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </AuthLayout>
    </>
  );
};

const GoogleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.6 29.4 4.5 24 4.5 13.3 4.5 4.5 13.3 4.5 24S13.3 43.5 24 43.5c10.4 0 19.1-7.6 19.1-19.1 0-1.3-.1-2.6-.4-3.9z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.6 29.4 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"
    />
    <path
      fill="#4CAF50"
      d="M24 43.5c5.3 0 10.1-2 13.7-5.3l-6.3-5.4C29.4 34.4 26.9 35.5 24 35.5c-5.3 0-9.8-3.1-11.3-7.5l-6.5 5C9.7 39.1 16.3 43.5 24 43.5z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-1 2.6-2.8 4.8-5.1 6.2l6.3 5.4C39.6 36.1 43.5 30.5 43.5 24c0-1.3-.1-2.6-.4-3.5z"
    />
  </svg>
);