import { cn } from '@/shared/lib/utils';

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent',
      className
    )}
  />
);
