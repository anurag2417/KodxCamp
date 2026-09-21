import { useMemo, useState } from 'react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { cn } from '@/shared/lib/utils';
import type { ProjectCategory } from '@/features/projects/api';

type Filter = 'all' | ProjectCategory;

const filters: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'React', value: 'react' },
  { label: 'API', value: 'api' },
  { label: 'SQL', value: 'sql' },
  { label: 'DataViz', value: 'dataviz' },
];

export const Projects: React.FC = () => {
  const { projects, loading, error, reload } = useProjects();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => p.category === filter);
  }, [projects, filter]);

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Projects</h1>
        <p className="mt-1 text-sm text-text-muted">
          Build real things. Save them, come back, share them.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-brand-500 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <ErrorState
          title="Couldn't load projects"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-text-muted">No projects in this category yet.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
};
