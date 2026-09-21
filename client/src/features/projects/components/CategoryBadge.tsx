import { cn } from '@/shared/lib/utils';
import type { ProjectCategory } from '@/features/projects/api';

const colors: Record<ProjectCategory, string> = {
  frontend: 'bg-[var(--color-cat-frontend)]/10 text-[var(--color-cat-frontend)]',
  react: 'bg-[var(--color-cat-react)]/10 text-[var(--color-cat-react)]',
  api: 'bg-[var(--color-cat-api)]/10 text-[var(--color-cat-api)]',
  sql: 'bg-[var(--color-cat-sql)]/10 text-[var(--color-cat-sql)]',
  dataviz: 'bg-[var(--color-cat-dataviz)]/10 text-[var(--color-cat-dataviz)]',
  javascript:
    'bg-[var(--color-cat-javascript)]/10 text-[var(--color-cat-javascript)]',
};

export const CategoryBadge: React.FC<{
  category: ProjectCategory;
  className?: string;
}> = ({ category, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
      colors[category],
      className
    )}
  >
    {category}
  </span>
);
