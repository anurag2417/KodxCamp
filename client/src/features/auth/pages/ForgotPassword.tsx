import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { AuthField } from '../components/AuthField';
import { Seo } from '../../../shared/components/seo/Seo';
import { authApi } from '../api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Could not send the reset link. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo
        title="Forgot password"
        description="Reset your KodxCamp password."
      />
      <AuthLayout
        title={sent ? 'Check your email' : 'Reset your password'}
        subtitle={
          sent
            ? `If an account exists for ${email}, we've sent a reset link. It expires in 30 minutes.`
            : "Enter your email and we'll send you a link to reset it."
        }
        footer={
          <>
            Remembered it?{' '}
            <Link
              to="/login"
              className="font-medium text-brand-500 hover:underline"
            >
              Back to sign in
            </Link>
          </>
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-success)]/10">
              <CheckCircle2
                size={28}
                className="text-[var(--color-success)]"
              />
            </div>
            <p className="text-sm text-text-muted">
              Didn't get it? Check your spam folder, or{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-medium text-brand-500 hover:underline"
              >
                try a different email
              </button>
              .
            </p>
          </div>
        ) : (
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
              autoFocus
            />

            {error && (
              <div className="auth-shake rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3.5 py-2.5 text-sm font-medium text-[var(--color-error)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending link…
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        )}
      </AuthLayout>
    </>
  );
};