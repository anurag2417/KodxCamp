import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { AuthField } from '../components/AuthField';
import { Seo } from '../../../shared/components/seo/Seo';
import { useAuthStore } from '../../../shared/store/auth.store';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const passwordStrength = (() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    return s;
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Try a different email.');
      }
      setBusy(false);
    }
  };

  return (
    <>
      <Seo
        title="Create account"
        description="Create your free KodxCamp account and start learning to code today."
      />
      <AuthLayout
        title="Create your account"
        subtitle="Free forever. Start writing code in under a minute."
        footer={
          <>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-brand-500 hover:underline"
            >
              Sign in
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
            label="Email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            isPassword
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            hint={
              password.length > 0
                ? undefined
                : 'Use 6 or more characters. Mixing letters and numbers helps.'
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