import { cn } from '@/shared/lib/utils';
import type { ApiProjectFile } from '@/features/projects/api';

interface Props {
  files: ApiProjectFile[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export const FileTabs: React.FC<Props> = ({ files, activeIndex, onChange }) => (
  <div className="flex items-center gap-1 overflow-x-auto">
    {files.map((f, i) => (
      <button
        key={f.name}
        onClick={() => onChange(i)}
        className={cn(
          'whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors',
          i === activeIndex
            ? 'bg-brand-500 text-white'
            : 'text-text-muted hover:bg-surface-tertiary hover:text-text-secondary'
        )}
      >
        {f.name}
      </button>
    ))}
  </div>
);
