import { useRef } from 'react';
import { useToast, type ToastContextValue } from './useToast';

/**
 * A stable reference to the toast context.
 *
 * Callers use it like `useToast()` — same shape, same methods — but
 * the returned object's identity is stable for the lifetime of the
 * component. This means it can be safely omitted from `useCallback`
 * dependency lists without violating React's rules or causing the
 * callback to close over a stale value.
 *
 * WHY THIS EXISTS
 * ---------------
 *
 * The canonical pattern for a data-loading callback is:
 *
 *   const reload = useCallback(async () => {
 *     try { ... } catch { toast.error('...'); }
 *   }, [slug, toast]);
 *
 *   useEffect(() => { void reload(); }, [reload]);
 *
 * When `toast` is a fresh reference every time a toast fires, a
 * failing `reload` produces a cascade:
 *
 *   1. effect runs -> reload fails -> toast fires
 *   2. toast provider re-renders -> new context value -> new `toast`
 *   3. `reload` identity changes -> effect deps changed -> effect runs
 *   4. goto 1
 *
 * The `ToastProvider` already memoizes its context value, which
 * breaks this cascade at the source. But a stable `toastRef` is a
 * second line of defense: it makes the callback identity independent
 * of the provider's internals entirely, so a future change to the
 * provider cannot reintroduce the loop.
 *
 * USAGE
 * -----
 *
 *   const toast = useStableToast();
 *
 *   const reload = useCallback(async () => {
 *     try { ... } catch { toast.error('...'); }
 *     // eslint-disable-next-line react-hooks/exhaustive-deps
 *   }, [slug, filter]);          // <- toast intentionally omitted
 *
 * The eslint-disable is required because eslint-plugin-react-hooks
 * does not understand that `toast` is stable. It is safe.
 */
export function useStableToast(): ToastContextValue {
  const toast = useToast();
  const ref = useRef(toast);
  ref.current = toast;
  return ref.current;
}