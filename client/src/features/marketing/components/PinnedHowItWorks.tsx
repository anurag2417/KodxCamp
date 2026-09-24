import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    n: '01',
    title: 'Pick a path',
    body: 'Courses, DSA topics, or projects. Everything is hands-on from the first minute.',
    accent: 'from-[#2A835F] to-[#12544F]',
  },
  {
    n: '02',
    title: 'Write real code',
    body: 'The same editor professionals use. Syntax highlighting, autocomplete, zero setup.',
    accent: 'from-[#0D7A9C] to-[#12544F]',
  },
  {
    n: '03',
    title: 'Instant feedback',
    body: 'Tests run in your browser. Pass, fail, iterate - the loop is seconds.',
    accent: 'from-[#8A5CCF] to-[#2A835F]',
  },
  {
    n: '04',
    title: 'Track progress',
    body: 'XP, streaks, achievements. Watch your skills build up week after week.',
    accent: 'from-[#C58A24] to-[#C65353]',
  },
];

export const PinnedHowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const passed = -rect.top;
      setScrollProgress(Math.max(0, Math.min(1, passed / total)));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative bg-bg"
      style={{ height: `${steps.length * 80}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="w-full">
          {/* Header */}
          <div className="px-6 pb-12 text-center md:px-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
              How it works
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold text-text-primary md:text-5xl">
              Four steps. Zero friction.
            </h2>
          </div>

          {/* Horizontal track */}
          <div
            className="flex gap-6 px-6 md:px-16"
            style={{
              transform: `translate3d(calc(-${scrollProgress * (steps.length - 1) * 100}% / ${steps.length}), 0, 0)`,
              transition: 'transform 100ms linear',
            }}
          >
            {steps.map((step) => (
              <article
                key={step.n}
                className="relative flex h-[420px] w-[85vw] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface p-10 md:w-[520px]"
              >
                <div
                  className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br ${step.accent} opacity-20 blur-3xl`}
                />
                <span className="text-sm font-mono text-text-muted">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-3xl font-bold text-text-primary md:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted">
                    {step.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full bg-brand-500 transition-all duration-300"
              style={{
                width:
                  scrollProgress >= i / (steps.length - 1) - 0.01 ? '32px' : '8px',
                opacity:
                  scrollProgress >= i / (steps.length - 1) - 0.01 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};