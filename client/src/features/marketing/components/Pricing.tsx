import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { useInView } from '../hooks/useInView';

const freeTier = [
  'All public courses',
  'DSA practice with real test cases',
  'Browser code editor (JS + Python)',
  'Live classes & recordings',
  'Progress tracking & achievements',
];

export const Pricing: React.FC = () => {
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
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">
            Start free. Learn forever.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            Everything you need to start is free. No credit card. No trial.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Free */}
          <div
            className={`relative rounded-2xl border-2 border-brand-500 bg-surface p-8 ${
              inView ? 'reveal-up' : 'opacity-0'
            }`}
          >
            <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles size={10} /> Most popular
            </span>
            <h3 className="text-lg font-semibold text-text-primary">Free</h3>
            <p className="mt-1 text-sm text-text-muted">
              For anyone who wants to start today.
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-text-primary">$0</span>
              <span className="ml-2 text-sm text-text-muted">/ forever</span>
            </p>
            <Link to="/register" className="mt-6 block">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
            <ul className="mt-8 space-y-3">
              {freeTier.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/10">
                    <Check size={12} className="text-brand-500" />
                  </span>
                  <span className="text-text-secondary">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro (coming soon) */}
          <div
            className={`relative rounded-2xl border border-border bg-surface p-8 ${
              inView ? 'reveal-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '120ms' }}
          >
            <h3 className="text-lg font-semibold text-text-primary">Pro</h3>
            <p className="mt-1 text-sm text-text-muted">
              For serious learners and teams.
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-text-primary">Soon</span>
            </p>
            <div className="mt-6">
              <Button size="lg" variant="secondary" className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
            <ul className="mt-8 space-y-3">
              {[
                'Everything in Free',
                'Private courses for teams',
                'Instructor-led cohorts',
                'Certificate of completion',
                'Priority support',
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-sm text-text-muted"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-tertiary">
                    <Check size={12} className="text-text-muted" />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};