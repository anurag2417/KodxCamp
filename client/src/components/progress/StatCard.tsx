import { cn } from '../../lib/utils';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: 'brand' | 'muted' | 'success' | 'warning';
}

const accents = {
  brand: 'text-brand-500',
  muted: 'text-text-secondary',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
};

export const StatCard: React.FC<Props> = ({
  label,
  value,
  hint,
  icon,
  accent = 'brand',
}) => (
  <div className="rounded-xl border border-border bg-surface p-5">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
      {icon && <span className={cn('opacity-80', accents[accent])}>{icon}</span>}
    </div>
    <p className={cn('mt-2 text-3xl font-bold', accents[accent])}>{value}</p>
    {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
  </div>
);