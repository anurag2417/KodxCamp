import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { AuthField } from '../components/AuthField';
import { Seo } from '../../../shared/components/seo/Seo';
import { authApi } from '../api';
import { useAuthStore } from '../../../shared/store/auth.store';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const passwordStrength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    return s;
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is invalid or has expired.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const { user } = await authApi.resetPassword(token, password);
      setSession(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Could not reset your password. Please try again.');
      }
      setBusy(false);
    }
  };

  return (
    <>
      <Seo
        title="Set a new password"
        description="Choose a new password for your KodxCamp account."
      />
      <AuthLayout
        title="Set a new password"
        subtitle="Choose a strong password you don't use anywhere else."
        footer={
          <>
            Changed your mind?{' '}
            <Link
              to="/login"
              className="font-medium text-brand-500 hover:underline"
            >
              Back to sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthField
            label="New password"
            icon={Lock}
            type="password"
            isPassword
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />

          {password.length > 0 && (
            <div className="auth-fade-in -mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      background:
                        i < passwordStrength
                          ? passwordStrength <= 2
                            ? '#C58A24'
                            : passwordStrength === 3
                              ? '#2A835F'
                              : '#12544F'
                          : 'var(--color-border)',
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[10px] uppercase tracking-widest text-text-muted">
                Strength:{' '}
                {['Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]}
              </p>
            </div>
          )}

          <AuthField
            label="Confirm password"
            icon={Lock}
            type="password"
            isPassword
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            error={
              confirm.length > 0 && password !== confirm
                ? 'Passwords do not match'
                : undefined
            }
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
                Updating password…
              </>
            ) : (
              <>
                Update password
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>
      </AuthLayout>
    </>
  );
};