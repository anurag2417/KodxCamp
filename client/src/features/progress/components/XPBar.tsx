interface Props {
  xp: number;
}

export function levelFromXp(xp: number) {
  let level = 1;
  let remaining = xp;
  let needed = 100;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = 100 + (level - 1) * 50;
  }
  return { level, remaining, needed, progress: remaining / needed };
}

export const XPBar: React.FC<Props> = ({ xp }) => {
  const { level, remaining, needed, progress } = levelFromXp(xp);
  const pct = Math.round(progress * 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-500">Lv {level}</span>
          <span className="text-sm text-text-muted">{xp.toLocaleString()} XP</span>
        </div>
        <span className="text-xs text-text-muted">
          {remaining} / {needed} to Lv {level + 1}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
