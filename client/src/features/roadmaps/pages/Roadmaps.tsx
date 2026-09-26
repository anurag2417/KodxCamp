import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings2, BookOpen } from 'lucide-react';
import { useRoadmaps } from '@/features/roadmaps/hooks/useRoadmaps';
import { RoadmapCard } from '@/features/roadmaps/components/RoadmapCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/shared/store/auth.store';
import { cn } from '@/shared/lib/utils';

type Filter = 'all' | 'free' | 'paid';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Paid', value: 'paid' },
];

/**
 * Public roadmap catalog.
 *
 * Master Spec, section 6 — Roadmap Discovery Page:
 *   "The Roadmaps page is primarily a discovery page."
 *
 * Login is not required. The page renders fully for anonymous users;
 * the enrollment flow only kicks in on the detail page's Get Started
 * button.
 */
export const Roadmaps: React.FC = () => {
  const { roadmaps, loading, error, reload } = useRoadmaps();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return roadmaps;
    if (filter === 'free') return roadmaps.filter((r) => r.isFree);
    return roadmaps.filter((r) => !r.isFree);
  }, [roadmaps, filter]);

  const count = roadmaps.length;

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="w-full px-4 py-12 md:px-6 lg:px-10 lg:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Roadmaps
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
              Pick a path. Walk it end to end.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-text-muted">
              A roadmap is a complete learning journey: multiple courses,
              projects, and live classes, in the order they were meant to be
              learned.
            </p>

            {!loading && !error && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-sm font-medium text-brand-500">
                <BookOpen size={14} />
                <span className="tabular-nums">{count}</span>
                <span className="opacity-80">
                  {count === 1 ? 'roadmap' : 'roadmaps'} available
                </span>
              </div>
            )}
          </div>

          {isAdmin && (
            <Link to="/admin/roadmaps">
              <Button variant="secondary">
                <Settings2 size={14} /> Manage roadmaps
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        {!loading && !error && roadmaps.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
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
        )}

        {/* Content */}
        {loading && (
          <div className="flex justify-center py-24">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {error && (
          <ErrorState
            title="Couldn't load roadmaps"
            message={error}
            onRetry={reload}
          />
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-text-muted">
            {roadmaps.length === 0
              ? 'No roadmaps published yet. Check back soon.'
              : `No ${filter} roadmaps yet.`}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <RoadmapCard key={r._id} roadmap={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};