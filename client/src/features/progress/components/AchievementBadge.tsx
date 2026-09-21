import { Lock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApiAchievement } from '@/features/progress/achievements.api';

interface Props {
  achievement: ApiAchievement;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 'text-2xl', pad: 'p-3', title: 'text-xs', desc: 'text-[10px]' },
  md: { icon: 'text-3xl', pad: 'p-4', title: 'text-sm', desc: 'text-xs' },
  lg: { icon: 'text-5xl', pad: 'p-6', title: 'text-base', desc: 'text-sm' },
};

export const AchievementBadge: React.FC<Props> = ({ achievement, size = 'md' }) => {
  const s = sizes[size];
  const unlocked = !!achievement.unlockedAt;
  const hidden = achievement.secret && !unlocked;

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border text-center transition-all',
        s.pad,
        unlocked
          ? 'border-brand-500/60 bg-brand-500/5'
          : 'border-border bg-surface opacity-60 grayscale'
      )}
    >
      <div className={cn('mb-2', s.icon)}>
        {hidden ? <Lock className="text-text-muted" /> : achievement.icon}
      </div>
      <p className={cn('font-semibold text-text-primary', s.title)}>
        {hidden ? '???' : achievement.title}
      </p>
      <p className={cn('mt-1 text-text-muted', s.desc)}>
        {hidden ? 'Secret achievement' : achievement.description}
      </p>
      <p className="mt-2 text-xs font-semibold text-brand-500">
        +{achievement.xpReward} XP
      </p>
    </div>
  );
};
