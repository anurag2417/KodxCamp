import { useMemo, useState } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { AchievementBadge } from '../components/progress/AchievementBadge';
import { cn } from '../lib/utils';
import type { AchievementCategory } from '../lib/achievements.api';

const TABS: { label: string; value: AchievementCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Learning', value: 'learning' },
  { label: 'Practice', value: 'practice' },
  { label: 'Projects', value: 'projects' },
  { label: 'Classes', value: 'classes' },
  { label: 'Streak', value: 'streak' },
  { label: 'Milestones', value: 'milestones' },
];

export const Achievements: React.FC = () => {
  const { achievements, loading, error, reload } = useAchievements();
  const [tab, setTab] = useState<AchievementCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return achievements;
    return achievements.filter((a) => a.category === tab);
  }, [achievements, tab]);

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
        <p className="mt-1 text-sm text-text-muted">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.value
                ? 'bg-brand-500 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
            )}
          >
            {t.label}
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
          title="Couldn't load achievements"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && (
        <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((a) => (
            <AchievementBadge key={a.key} achievement={a} />
          ))}
        </div>
      )}
    </div>
  );
};