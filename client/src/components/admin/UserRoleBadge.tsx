import { cn } from '../../lib/utils';

interface Props {
  role: 'student' | 'instructor' | 'admin';
}

const styles: Record<Props['role'], string> = {
  student: 'bg-surface-tertiary text-text-secondary',
  instructor: 'bg-[#0D7A9C]/10 text-[#0D7A9C] dark:bg-[#0D7A9C]/20 dark:text-[#7FC7B4]',
  admin: 'bg-[#C65353]/10 text-[#C65353] dark:bg-[#C65353]/20 dark:text-[#F07178]',
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