import React from 'react';
import { cn } from '@/shared/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm',
        'text-text-primary placeholder:text-text-muted',
        'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300/60',
        'transition-colors',
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = 'Input';
