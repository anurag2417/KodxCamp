import { useEffect, useState } from 'react';
import { CheckCircle2, X, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';

interface Props {
  open: boolean;
  runtimeMs: number;
  language: string;
  xpAwarded?: number;
  onClose: () => void;
}

export const AcceptanceOverlay: React.FC<Props> = ({
  open,
  runtimeMs,
  language,
  xpAwarded,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger enter animation on next frame
      const t = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(t);
    } else {
      setMounted(false);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 grid place-items-center bg-black/50 p-4',
        'transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="acceptance-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-8 text-center shadow-2xl',
          'transition-all duration-300 ease-out',
          mounted
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-2'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-tertiary"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Animated checkmark */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <div className="relative">
            <span
              className={cn(
                'absolute inset-0 rounded-full bg-[var(--color-success)]/20',
                'animate-ping-slow'
              )}
              aria-hidden="true"
            />
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-[var(--color-success)]/10">
              <CheckCircle2
                size={44}
                className="text-[var(--color-success)] acceptance-draw"
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        <h2
          id="acceptance-title"
          className="text-2xl font-bold text-text-primary"
        >
          Accepted
        </h2>

        <p className="mt-2 text-sm text-text-muted">
          All test cases passed. Nice work.
        </p>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Runtime" value={`${runtimeMs}ms`} />
          <Stat label="Language" value={language} />
        </div>

        {xpAwarded && xpAwarded > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-500">
            <Sparkles size={14} />
            <span>+{xpAwarded} XP earned</span>
          </div>
        )}

        <Button onClick={onClose} size="lg" className="mt-6 w-full">
          Continue
        </Button>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-border bg-surface-secondary px-3 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-text-primary">{value}</p>
  </div>
);
