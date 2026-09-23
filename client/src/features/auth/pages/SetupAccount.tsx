import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { AuthField } from '../components/AuthField';
import { Seo } from '../../../shared/components/seo/Seo';
import { authApi } from '../api';
import { useAuthStore } from '../../../shared/store/auth.store';

export const SetupAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const setupToken = searchParams.get('setupToken') ?? '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!setupToken) {
      navigate('/signup', { replace: true });
    }
  }, [setupToken, navigate]);

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
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const { user } = await authApi.setPassword({
        setupToken,
        name: name.trim(),
        password,
      });
      setSession(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Could not complete signup. Please try again.');
      }
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Finish your account" description="Set a name and password." />
      <AuthLayout
        title="Almost there"
        subtitle="Set your name and password to finish creating your account."
        footer={
          <>
            Having trouble?{' '}
            <Link
              to="/signup"
              className="font-medium text-brand-500 hover:underline"
            >
              Start over
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthField
            label="Full name"
            icon={User}
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            autoFocus
          />

          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            isPassword
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            hint={
              password.length > 0
                ? undefined
                : 'Use 8 or more characters. Mixing letters, numbers, and symbols helps.'
            }
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
                Creating account…
              </>
            ) : (
              <>
                Create account
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