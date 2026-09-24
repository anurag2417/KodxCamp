import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApiCourseCurriculumModule } from '@/features/courses/api';

interface Props {
  modules: ApiCourseCurriculumModule[];
}

export const CurriculumAccordion: React.FC<Props> = ({ modules }) => {
  const [open, setOpen] = useState<number | null>(0);

  if (modules.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {modules.map((m, i) => {
        const isOpen = open === i;
        const num = String(i + 1).padStart(2, '0');
        return (
          <div
            key={i}
            className={cn(
              'overflow-hidden rounded-2xl border bg-surface-secondary transition-colors',
              isOpen ? 'border-brand-500/40' : 'border-border'
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="font-mono text-sm text-text-muted">
                  {num}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text-primary">
                    {m.title}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {m.lessons} lesson{m.lessons === 1 ? '' : 's'}
                    {m.duration && ` · ${m.duration}`}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={cn(
                  'shrink-0 text-text-muted transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>

            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: isOpen ? `${m.items.length * 40 + 16}px` : '0px',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <ul className="border-t border-border px-5 py-3">
                {m.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 py-1.5 text-sm text-text-secondary"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};