import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, RotateCw } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInput } from '../components/OtpInput';
import { Seo } from '../../../shared/components/seo/Seo';
import { authApi } from '../api';

export const VerifyOtp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  const handleVerify = async (value: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { setupToken } = await authApi.verifyOtp(email, value);
      navigate(
        `/signup/setup?setupToken=${encodeURIComponent(setupToken)}`,
        { replace: true }
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Verification failed. Please try again.');
      }
      setCode('');
      setBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Enter all six digits.');
      return;
    }
    await handleVerify(code);
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
        setError('Could not resend the code. Try again shortly.');
      }
    } finally {
      setResending(false);
    }
  };

  const canResend = !resentAt || Date.now() - resentAt > 30_000;

  return (
    <>
      <Seo title="Verify your email" description="Enter the code we sent you." />
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
        footer={
          <>
            Wrong email?{' '}
            <Link
              to="/signup"
              className="font-medium text-brand-500 hover:underline"
            >
              Start over
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            Didn't get the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || resending}
              className="inline-flex items-center gap-1 font-medium text-brand-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCw size={12} />
              )}
              {canResend ? 'Resend' : 'Resend in 30s'}
            </button>
          </div>
        </form>
      </AuthLayout>
    </>
  );
};