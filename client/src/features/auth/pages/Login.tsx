import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useAuthStore } from '@/shared/store/auth.store';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
        <p className="mt-1 text-sm text-text-muted">Login to continue learning</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          New here?{' '}
          <Link to="/register" className="text-brand-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
