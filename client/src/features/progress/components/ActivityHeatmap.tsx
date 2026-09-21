import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import type { ApiHeatmapDay } from '@/features/progress/api';

interface Props {
  data: ApiHeatmapDay[];
}

export const ActivityHeatmap: React.FC<Props> = ({ data }) => {
  const weeks = useMemo(() => {
    const out: ApiHeatmapDay[][] = [];
    let current: ApiHeatmapDay[] = [];

    if (data.length > 0) {
      const first = new Date(data[0].day);
      const dayOfWeek = first.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        current.push({ day: '', count: 0, xp: 0 });
      }
    }

    for (const d of data) {
      current.push(d);
      if (current.length === 7) {
        out.push(current);
        current = [];
      }
    }
    if (current.length) out.push(current);
    return out;
  }, [data]);

  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data]
  );

  const color = (count: number, day: string) => {
    if (!day) return 'bg-transparent';
    if (count === 0) return 'bg-surface-tertiary';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-brand-300/60';
    if (intensity <= 0.5) return 'bg-brand-500/60';
    if (intensity <= 0.75) return 'bg-brand-500';
    return 'bg-brand-700';
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d, di) => (
              <div
                key={`${wi}-${di}`}
                title={
                  d.day ? `${d.day}: ${d.count} activities, ${d.xp} XP` : ''
                }
                className={cn('h-3 w-3 rounded-sm', color(d.count, d.day))}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-surface-tertiary" />
        <div className="h-3 w-3 rounded-sm bg-brand-300/60" />
        <div className="h-3 w-3 rounded-sm bg-brand-500/60" />
        <div className="h-3 w-3 rounded-sm bg-brand-500" />
        <div className="h-3 w-3 rounded-sm bg-brand-700" />
        <span>More</span>
      </div>
    </div>
  );
};
