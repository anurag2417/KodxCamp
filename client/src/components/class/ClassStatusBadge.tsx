import { cn } from '../../lib/utils';
import type { ClassStatus } from '../../lib/classes.api';

const styles: Record<ClassStatus, string> = {
  scheduled: 'bg-[#0D7A9C]/10 text-[#0D7A9C] dark:bg-[#0D7A9C]/20 dark:text-[#7FC7B4]',
  live: 'bg-[#C65353]/10 text-[#C65353] dark:bg-[#C65353]/20 dark:text-[#F07178]',
  ended: 'bg-[#2A835F]/10 text-[#2A835F] dark:bg-[#2A835F]/20 dark:text-[#8BBB92]',
  cancelled: 'bg-[#8A5CCF]/10 text-[#8A5CCF] dark:bg-[#8A5CCF]/20 dark:text-[#C7A8F0]',
};

export const ClassStatusBadge: React.FC<{ status: ClassStatus; className?: string }> = ({
  status,
  className,
}) => (
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