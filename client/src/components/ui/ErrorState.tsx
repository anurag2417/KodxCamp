import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<Props> = ({
  title = 'Something went wrong',
  message = 'We couldn\u2019t load this content. Please try again.',
  onRetry,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-8 text-center',
      className
    )}
  >
    <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)]">
      <AlertTriangle size={22} />
    </div>
    <h3 className="mt-4 text-sm font-semibold text-text-primary">{title}</h3>
    <p className="mt-1 max-w-md text-xs text-text-muted">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        <RefreshCw size={14} /> Retry
      </Button>
    )}
  </div>
);