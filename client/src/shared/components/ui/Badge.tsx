import React from 'react';
import { cn } from '@/shared/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'brand' | 'muted' | 'success' | 'warning' | 'danger';
}

const tones = {
  brand: 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
  muted: 'bg-surface-tertiary text-text-secondary',
  success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  danger: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'brand', className, children, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      tones[tone],
      className
    )}
    {...rest}
  >
    {children}
  </span>
);
