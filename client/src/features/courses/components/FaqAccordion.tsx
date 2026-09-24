import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApiCourseFaqItem } from '@/features/courses/api';

interface Props {
  items: ApiCourseFaqItem[];
}

export const FaqAccordion: React.FC<Props> = ({ items }) => {
  const [open, setOpen] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              'overflow-hidden rounded-xl border bg-surface-secondary transition-colors',
              isOpen ? 'border-brand-500/40' : 'border-border'
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-text-primary">
                {item.question}
              </span>
              {isOpen ? (
                <Minus size={16} className="shrink-0 text-text-muted" />
              ) : (
                <Plus size={16} className="shrink-0 text-text-muted" />
              )}
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: isOpen ? '400px' : '0px',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <p className="px-5 pb-4 text-sm leading-relaxed text-text-secondary">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};