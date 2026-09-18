import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Spinner } from '../ui/Spinner';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};