import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useAuthStore } from '@/shared/store/auth.store';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Try a different email.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
        <p className="mt-1 text-sm text-text-muted">Start learning by doing</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
