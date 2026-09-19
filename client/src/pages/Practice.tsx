import { useMemo, useState } from 'react';
import { useProblems } from '../hooks/useProblems';
import { ProblemCard } from '../components/problem/ProblemCard';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { cn } from '../lib/utils';
import type { Difficulty } from '../lib/problems.api';

type Filter = 'all' | Difficulty;

const filters: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

export const Practice: React.FC = () => {
  const { problems, loading, error, reload } = useProblems();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return problems;
    return problems.filter((p) => p.difficulty === filter);
  }, [problems, filter]);

  const counts = useMemo(
    () => ({
      all: problems.length,
      easy: problems.filter((p) => p.difficulty === 'easy').length,
      medium: problems.filter((p) => p.difficulty === 'medium').length,
      hard: problems.filter((p) => p.difficulty === 'hard').length,
    }),
    [problems]
  );

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">DSA Practice</h1>
        <p className="mt-1 text-sm text-text-muted">
          Real test cases, browser-based execution, zero contest pressure.
        </p>
      </div>

      {/* Filters */}
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
            {f.label}{' '}
            <span className="opacity-70">({counts[f.value]})</span>
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
          title="Couldn't load problems"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-text-muted">No problems in this category yet.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProblemCard key={p._id} problem={p} />
          ))}
        </div>
      )}
    </div>
  );
};