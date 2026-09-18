import { cn } from '../../lib/utils';
import type { Difficulty } from '../../lib/problems.api';

const styles: Record<Difficulty, string> = {
  easy: 'bg-[#2A835F]/10 text-[#2A835F] dark:bg-[#2A835F]/20 dark:text-[#8BBB92]',
  medium: 'bg-[#C58A24]/10 text-[#C58A24] dark:bg-[#C58A24]/20 dark:text-[#EBCB7A]',
  hard: 'bg-[#C65353]/10 text-[#C65353] dark:bg-[#C65353]/20 dark:text-[#F07178]',
};

export const DifficultyBadge: React.FC<{ difficulty: Difficulty; className?: string }> = ({
  difficulty,
  className,
}) => (
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