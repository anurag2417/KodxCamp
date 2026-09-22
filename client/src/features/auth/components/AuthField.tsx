import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  isPassword?: boolean;
  hint?: string;
  error?: string;
}

export const AuthField = forwardRef<HTMLInputElement, Props>(
  (
    { label, icon: Icon, isPassword, hint, error, className, ...rest },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const type = isPassword ? (visible ? 'text' : 'password') : rest.type;

    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>

        <div className="group relative">
          <Icon
            size={16}
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors',
              error
                ? 'text-[var(--color-error)]'
                : 'text-text-muted group-focus-within:text-brand-500'
            )}
          />

          <input
            ref={ref}
            {...rest}
            type={type}
            className={cn(
              'w-full rounded-xl border bg-surface px-4 py-3 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted/70',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2',
              error
                ? 'border-[var(--color-error)]/50 focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                : 'border-border hover:border-border/80 focus:border-brand-500 focus:ring-brand-500/15',
              className
            )}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              tabIndex={-1}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:text-text-secondary"
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

AuthField.displayName = 'AuthField';