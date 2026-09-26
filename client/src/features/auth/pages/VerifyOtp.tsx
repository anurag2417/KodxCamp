import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowRight, Mail } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInput } from '../components/OtpInput';
import { Seo } from '../../../shared/components/seo/Seo';
import { authApi } from '../api';
import { resolveNext, withNext } from '../lib/redirect';

export const VerifyOtp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = (searchParams.get('email') ?? '').trim().toLowerCase();
  const next = resolveNext(searchParams.toString());

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);

  // Guards against re-submitting the same code while the request is
  // in flight. Cleared on any failure so the user can retry.
  const submittedRef = useRef<string | null>(null);

  // Auto-submit when all six digits are filled.
  useEffect(() => {
    if (code.length !== 6 || busy) return;
    if (submittedRef.current === code) return;
    submittedRef.current = code;
    void handleVerify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async (value: string) => {
    setError('');
    setBusy(true);
    try {
      // The verify endpoint always returns a setupToken; it never
      // establishes a session. The account becomes usable only after
      // /auth/set-password runs on /signup/setup. That is where
      // signup_complete fires — not here.
      const { setupToken } = await authApi.verifyOtp(email, value);

      const setupPath = `/signup/setup?setupToken=${encodeURIComponent(
        setupToken
      )}`;
      navigate(withNext(setupPath, next));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('The code is incorrect or has expired.');
      }
      setBusy(false);
      submittedRef.current = null;
      setCode('');
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.resendOtp(email);
      setResentAt(Date.now());
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Could not resend the code. Try again.');
      }
    } finally {
      setResending(false);
    }
  };

  const resendDisabled = useMemo(() => {
    if (!resentAt) return false;
    return Date.now() - resentAt < 30_000;
  }, [resentAt]);

  if (!email) {
    return (
      <>
        <Seo
          title="Verify email"
          description="Enter your verification code."
        />
        <AuthLayout
          title="Missing email"
          subtitle="This page needs an email address to verify. Start over from signup."
          footer={
            <Link
              to="/signup"
              className="font-medium text-brand-500 hover:underline"
            >
              Back to signup
            </Link>
          }
        >
          <div className="flex justify-center py-4">
            <Mail size={40} className="text-text-muted" />
          </div>
        </AuthLayout>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Verify your email"
        description="Enter the six-digit code we sent to your email."
      />
      <AuthLayout
        title="Check your email"
        subtitle={
          <>
            We sent a six-digit code to{' '}
            <strong className="text-text-primary">{email}</strong>.
          </>
        }
        footer={
          <>
            Wrong email?{' '}
            <Link
              to={withNext('/signup', next)}
              className="font-medium text-brand-500 hover:underline"
            >
              Start over
            </Link>
          </>
        }
      >
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void handleVerify(code);
          }}
          className="flex flex-col gap-6"
        >
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={busy}
            autoFocus
          />

          {error && (
            <div className="auth-shake rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3.5 py-2.5 text-sm font-medium text-[var(--color-error)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                Verify
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>

          <div className="text-center text-xs text-text-muted">
            Didn&rsquo;t get the code?{' '}
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resending || resendDisabled}
              className="font-medium text-brand-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending
                ? 'Sending…'
                : resendDisabled
                  ? 'Resend in 30s'
                  : 'Resend code'}
            </button>
          </div>
        </form>
      </AuthLayout>
    </>
  );
};