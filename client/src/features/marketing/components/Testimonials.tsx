import { useInView } from '../hooks/useInView';

const testimonials = [
  {
    quote:
      'Finally a coding platform that respects my time. No 30-minute video intros. Just code.',
    name: 'Aditya R.',
    role: 'CS student',
  },
  {
    quote:
      'The browser execution is what sold me. I can practice on the train without installing anything.',
    name: 'Priya K.',
    role: 'Career switcher',
  },
  {
    quote:
      'DSA practice that isn\'t a leaderboard. I actually want to come back every day.',
    name: 'Vikram S.',
    role: 'Self-taught developer',
  },
];

export const Testimonials: React.FC = () => {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="bg-surface-secondary py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`mx-auto max-w-2xl text-center ${
            inView ? 'reveal-up' : 'opacity-0'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
            Loved by learners
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">
            Built for people who actually want to learn.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className={`rounded-2xl border border-border bg-surface p-6 ${
                inView ? 'reveal-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <blockquote className="text-sm leading-relaxed text-text-secondary">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {t.name}
                  </p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};