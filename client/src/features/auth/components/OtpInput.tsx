import { useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react';
import { cn } from '@/shared/lib/utils';

interface Props {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Six-digit code input.
 *
 * Behavior:
 *   - One digit per box, auto-advance on input.
 *   - Backspace moves back a box.
 *   - Paste fills every box.
 *   - Arrow keys navigate.
 *   - Fires `onComplete` when every box is filled.
 */
export const OtpInput: React.FC<Props> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) {
      refs.current[0]?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusIndex = (i: number) => {
    const idx = Math.max(0, Math.min(length - 1, i));
    refs.current[idx]?.focus();
    refs.current[idx]?.select();
  };

  const setDigit = (i: number, d: string) => {
    const next = value.split('');
    next[i] = d;
    // Trim trailing empty slots.
    const joined = next.join('').slice(0, length);
    onChange(joined);
  };

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1);
    if (!d) return;
    setDigit(i, d);
    if (i < length - 1) focusIndex(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        setDigit(i, '');
      } else if (i > 0) {
        const next = value.split('');
        next[i - 1] = '';
        onChange(next.join(''));
        focusIndex(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusIndex(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusIndex(i + 1);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      setDigit(i, '');
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-14 w-12 rounded-xl border border-border bg-surface text-center font-mono text-2xl font-semibold text-text-primary',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            'disabled:opacity-50',
            'transition-colors'
          )}
        />
      ))}
    </div>
  );
};