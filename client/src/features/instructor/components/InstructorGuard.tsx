import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/auth.store';
import { Spinner } from '@/shared/components/ui/Spinner';

export const InstructorGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
  if (user.role !== 'instructor' && user.role !== 'admin') {
    // CHANGED: was /dashboard, which now redirects to /my-learning.
    // Pointing directly at the final destination avoids a redirect hop.
    return <Navigate to="/my-learning" replace />;
  }
  return <>{children}</>;
};