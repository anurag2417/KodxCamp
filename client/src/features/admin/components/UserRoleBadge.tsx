import { cn } from '@/shared/lib/utils';

interface Props {
  role: 'student' | 'instructor' | 'admin';
}

const styles: Record<Props['role'], string> = {
  student: 'bg-surface-tertiary text-text-secondary',
  instructor: 'bg-[var(--color-cat-react)]/10 text-[var(--color-cat-react)]',
  admin: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
};

export const UserRoleBadge: React.FC<Props> = ({ role }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
      styles[role]
    )}
  >
    {role}
  </span>
);
