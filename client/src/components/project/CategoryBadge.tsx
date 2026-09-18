import { cn } from '../../lib/utils';
import type { ProjectCategory } from '../../lib/projects.api';

const colors: Record<ProjectCategory, string> = {
  frontend: 'bg-[#2A835F]/10 text-[#2A835F] dark:bg-[#2A835F]/20 dark:text-[#8BBB92]',
  react: 'bg-[#0D7A9C]/10 text-[#0D7A9C] dark:bg-[#0D7A9C]/20 dark:text-[#7FC7B4]',
  api: 'bg-[#8A5CCF]/10 text-[#8A5CCF] dark:bg-[#8A5CCF]/20 dark:text-[#C7A8F0]',
  sql: 'bg-[#C58A24]/10 text-[#C58A24] dark:bg-[#C58A24]/20 dark:text-[#EBCB7A]',
  dataviz: 'bg-[#C65353]/10 text-[#C65353] dark:bg-[#C65353]/20 dark:text-[#F07178]',
  javascript: 'bg-[#C5A024]/10 text-[#C5A024] dark:bg-[#C5A024]/20 dark:text-[#EBCB7A]',
};

export const CategoryBadge: React.FC<{ category: ProjectCategory; className?: string }> = ({
  category,
  className,
}) => (
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