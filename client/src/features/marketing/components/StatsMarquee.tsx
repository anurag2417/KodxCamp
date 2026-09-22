const items = [
  { label: 'Interactive lessons', value: '200+' },
  { label: 'DSA problems', value: '50+' },
  { label: 'Real projects', value: '25+' },
  { label: 'Live classes', value: 'Weekly' },
  { label: 'Lines executed', value: '1M+' },
  { label: 'Learners', value: 'Growing' },
];

export const StatsMarquee: React.FC = () => {
  // Duplicate the list so the animation loops seamlessly
  const loop = [...items, ...items];

  return (
    <section className="relative overflow-hidden border-y border-border bg-surface py-8">
      {/* Left/right fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-surface to-transparent" />

      <div className="marquee-track flex items-center gap-16">
        {loop.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="flex shrink-0 items-center gap-3"
          >
            <span className="text-2xl font-bold text-text-primary">
              {item.value}
            </span>
            <span className="text-sm text-text-muted">{item.label}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500/40" />
          </div>
        ))}
      </div>
    </section>
  );
};