import { cn } from '../../lib/utils';
import type { ClassStatus } from '../../lib/classes.api';

const styles: Record<ClassStatus, string> = {
  scheduled:
    'bg-[var(--color-status-scheduled)]/10 text-[var(--color-status-scheduled)]',
  live:
    'bg-[var(--color-status-live)]/10 text-[var(--color-status-live)]',
  ended:
    'bg-[var(--color-status-ended)]/10 text-[var(--color-status-ended)]',
  cancelled:
    'bg-[var(--color-status-cancelled)]/10 text-[var(--color-status-cancelled)]',
};

export const ClassStatusBadge: React.FC<{
  status: ClassStatus;
  className?: string;
}> = ({ status, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
      styles[status],
      className
    )}
  >
    {status === 'live' && (
      <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
    )}
    {status}
  </span>
);