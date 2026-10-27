import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import {
  ToastContext,
  type Toast,
  type ToastKind,
  type ToastContextValue,
} from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

const kindStyles: Record<ToastKind, string> = {
  success: 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10',
  error: 'border-[var(--color-error)]/40 bg-[var(--color-error)]/10',
  info: 'border-brand-500/40 bg-brand-500/10',
  warning: 'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10',
};

const kindIcon: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-[var(--color-success)]" />,
  error: <XCircle size={18} className="text-[var(--color-error)]" />,
  info: <Info size={18} className="text-brand-500" />,
  warning: <AlertTriangle size={18} className="text-[var(--color-warning)]" />,
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: Toast = { id, durationMs: 4000, ...input };
      setToasts((prev) => [...prev, toast]);
      if (toast.durationMs && toast.durationMs > 0) {
        window.setTimeout(() => remove(id), toast.durationMs);
      }
    },
    [remove]
  );

  const success = useCallback(
    (message: string, title?: string) =>
      push({ kind: 'success', message, title }),
    [push]
  );
  const error = useCallback(
    (message: string, title?: string) =>
      push({ kind: 'error', message, title, durationMs: 6000 }),
    [push]
  );
  const info = useCallback(
    (message: string, title?: string) => push({ kind: 'info', message, title }),
    [push]
  );
  const warning = useCallback(
    (message: string, title?: string) =>
      push({ kind: 'warning', message, title }),
    [push]
  );

  /**
   * Memoized context value.
   *
   * This is the fix for a class of infinite loops: consumers that
   * included `toast` in a `useCallback` dependency list, where that
   * callback then ended up in a `useEffect` dependency list. With a
   * fresh `value` object every render, adding a toast changed the
   * context value, which changed the consumer's callback identity,
   * which re-ran its effect, which (on failure) added another toast —
   * loop.
   *
   * Every function below is itself `useCallback`'d, so this memo only
   * recomputes if one of those function identities changes — which
   * they don't, for the lifetime of the provider.
   */
  const value: ToastContextValue = useMemo(
    () => ({ push, remove, success, error, info, warning }),
    [push, remove, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[360px] max-w-[calc(100vw-3rem)] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({
  toast,
  onClose,
}) => {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm',
        'bg-surface/95',
        kindStyles[toast.kind],
        entering ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
        'transition-all duration-200'
      )}
      role="alert"
    >
      <div className="shrink-0">{kindIcon[toast.kind]}</div>
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        )}
        <p className="text-sm text-text-secondary">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-md p-1 text-text-muted hover:bg-surface-tertiary hover:text-text-secondary"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
};