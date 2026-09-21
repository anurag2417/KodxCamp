import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useInView } from '../hooks/useInView';

const faqs = [
  {
    q: 'Do I need to install anything?',
    a: 'No. Everything runs in your browser — the editor, the code execution, even the Python runtime. Just open a course and start coding.',
  },
  {
    q: 'What languages can I run?',
    a: 'JavaScript, Python, and SQL run directly in your browser. HTML, CSS, Tailwind, and React projects render in a live preview.',
  },
  {
    q: 'Is this a competitive platform?',
    a: 'No. No contests, no leaderboards, no timed rounds. Just you, the problems, and calm progress.',
  },
  {
    q: 'Do you have live classes?',
    a: 'Yes. Instructors schedule live classes via Google Meet, and recordings are available to enrolled students forever.',
  },
  {
    q: 'Is it really free?',
    a: 'The core platform is free — courses, practice, projects, live classes. We will offer a Pro tier for teams and certificates later. Nothing you learn today will ever be paywalled.',
  },
  {
    q: 'Can I use it on my phone?',
    a: 'Yes. The marketing site and most learning pages are fully responsive. We are actively improving the mobile editor experience.',
  },
];

export const Faq: React.FC = () => {
  const { ref, inView } = useInView();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section ref={ref} className="bg-surface-secondary py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div
          className={`text-center ${inView ? 'reveal-up' : 'opacity-0'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className={`overflow-hidden rounded-xl border border-border bg-surface ${
                  inView ? 'reveal-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-text-primary">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'shrink-0 text-text-muted transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: isOpen ? '200px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p className="px-5 pb-4 text-sm leading-relaxed text-text-muted">
                    {faq.a}
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