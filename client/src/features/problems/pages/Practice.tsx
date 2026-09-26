import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProblems } from '@/features/problems/hooks/useProblems';
import { ProblemCard } from '@/features/problems/components/ProblemCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Seo } from '@/shared/components/seo/Seo';
import { useAuthStore } from '@/shared/store/auth.store';
import { cn } from '@/shared/lib/utils';
import type { Difficulty, ProblemTier } from '@/features/problems/api';

type DiffFilter = 'all' | Difficulty;

const diffFilters: { label: string; value: DiffFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const tiers: { label: string; value: ProblemTier; hint: string }[] = [
  {
    label: 'Starter',
    value: 'starter',
    hint: 'Learn the fundamentals',
  },
  {
    label: 'Interview',
    value: 'interview',
    hint: 'Interview-grade problems',
  },
];

/**
 * Public practice catalog.
 *
 * Master Spec, section 4:
 *   "Practice is public (browse without account)."
 *
 * The page renders fully for anonymous users. The `solved` badge on
 * each card is absent for guests — the server omits it when no user
 * is attached.
 */
export const Practice: React.FC = () => {
  const [tier, setTier] = useState<ProblemTier>('starter');
  const { problems, loading, error, reload } = useProblems(tier);
  const user = useAuthStore((s) => s.user);
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');

  const filtered = useMemo(() => {
    if (diffFilter === 'all') return problems;
    return problems.filter((p) => p.difficulty === diffFilter);
  }, [problems, diffFilter]);

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
    <>
      <Seo
        title="Practice coding problems"
        description="Free coding practice problems you can solve in your browser. No account required to browse."
      />
      <div className="w-full p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Practice</h1>
          <p className="mt-1 text-sm text-text-muted">
            Solve problems in the browser. Free, no submission limits.
          </p>
          {!user && (
            <p className="mt-2 text-xs text-text-muted">
              Browse freely.{' '}
              <Link to="/login" className="text-brand-500 hover:underline">
                Sign in
              </Link>{' '}
              to track your progress and keep your drafts.
            </p>
          )}
        </div>

        {/* Tier tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          {tiers.map((t) => (
            <button
              key={t.value}
              onClick={() => setTier(t.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                tier === t.value
                  ? 'border-b-2 border-brand-500 text-brand-500'
                  : 'border-b-2 border-transparent text-text-muted hover:text-text-secondary'
              )}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {diffFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setDiffFilter(f.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                diffFilter === f.value
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
          <p className="text-text-muted">
            No {tier} problems in this difficulty yet.
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <ProblemCard key={p._id} problem={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};