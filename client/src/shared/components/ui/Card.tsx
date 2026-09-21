import React from 'react';
import { cn } from '@/shared/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'rounded-xl border border-border bg-surface shadow-sm',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);
