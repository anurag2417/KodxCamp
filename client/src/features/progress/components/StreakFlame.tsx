interface Props {
  streak: number;
  size?: 'sm' | 'lg';
}

export const StreakFlame: React.FC<Props> = ({ streak, size = 'lg' }) => {
  const isLg = size === 'lg';
  const intensity =
    streak >= 30
      ? 'text-orange-500'
      : streak >= 7
        ? 'text-orange-400'
        : streak > 0
          ? 'text-orange-300'
          : 'text-text-muted';

  return (
    <div className="flex items-center gap-2">
      <span className={`${intensity} ${isLg ? 'text-3xl' : 'text-xl'}`}>🔥</span>
      <div>
        <div className={`font-bold text-text-primary ${isLg ? 'text-2xl' : 'text-base'}`}>
          {streak}
        </div>
        {isLg && (
          <div className="text-xs text-text-muted">
            day{streak === 1 ? '' : 's'} streak
          </div>
        )}
      </div>
    </div>
  );
};
