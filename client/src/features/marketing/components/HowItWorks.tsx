import { useInView } from '../hooks/useInView';

const steps = [
  {
    n: '01',
    title: 'Pick a path',
    body: 'Choose a course, a DSA topic, or a project. Everything is hands-on from the first minute.',
  },
  {
    n: '02',
    title: 'Write real code',
    body: 'Use the same editor professionals use. Syntax highlighting, autocomplete, zero setup.',
  },
  {
    n: '03',
    title: 'See instant feedback',
    body: 'Tests run in your browser. Pass, fail, iterate — the loop is seconds, not minutes.',
  },
  {
    n: '04',
    title: 'Track everything',
    body: 'XP, streaks, achievements. See your progress build up week over week.',
  },
];

export const HowItWorks: React.FC = () => {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="bg-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`mx-auto max-w-2xl text-center ${
            inView ? 'reveal-up' : 'opacity-0'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">
            From hello world to shipped project.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            Four steps. No tutorials longer than your attention span.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connector line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

          <div className="grid gap-12 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`relative flex flex-col items-center text-center ${
                  inView ? 'reveal-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="relative z-10 grid h-14 w-14 place-items-center rounded-full border border-border bg-surface text-lg font-bold text-brand-500 shadow-sm">
                  {step.n}
                </div>
                <h3 className="mt-6 text-base font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm text-text-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};