import { cn } from '@/shared/lib/utils';
import type { Difficulty } from '@/features/problems/api';

const styles: Record<Difficulty, string> = {
  easy: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  medium: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  hard: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
};

export const DifficultyBadge: React.FC<{
  difficulty: Difficulty;
  className?: string;
}> = ({ difficulty, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
      styles[difficulty],
      className
    )}
  >
    {difficulty}
  </span>
);
