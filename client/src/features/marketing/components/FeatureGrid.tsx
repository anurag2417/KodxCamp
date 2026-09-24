import {
  BookOpen,
  Zap,
  Code2,
  Rocket,
  Video,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useInView } from '../hooks/useInView';

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const features: Feature[] = [
  {
    title: 'Interactive Lessons',
    description:
      'Read a concept, then write and run code immediately. No context switching, no setup.',
    icon: BookOpen,
  },
  {
    title: 'DSA Practice',
    description:
      'Real test cases graded in your browser. Difficulty filters, topic tags, zero contest pressure.',
    icon: Zap,
  },
  {
    title: 'Browser Execution',
    description:
      'Run JavaScript, Python, and SQL safely in your browser. No server roundtrips, no installs.',
    icon: Code2,
  },
  {
    title: 'Real Projects',
    description:
      'Build frontend, React, and SQL projects with live preview. Save and come back anytime.',
    icon: Rocket,
  },
  {
    title: 'Live Classes',
    description:
      'Join Google Meet sessions with instructors, or catch up on recordings later at your pace.',
    icon: Video,
  },
  {
    title: 'Progress & Achievements',
    description:
      'XP, streaks, and 18 achievements that reward consistency - not competition.',
    icon: Trophy,
  },
];

export const FeatureGrid: React.FC = () => {
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
            Why KodxCamp
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">
            Everything you need to learn to code.
          </h2>
          <p className="mt-4 text-base text-text-muted">
            One calm environment. No downloads. No 40-minute video intros. Just
            you and the code.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-lg ${
                  inView ? 'reveal-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-brand-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-brand-500 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};