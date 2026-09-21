import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';

export const Home: React.FC = () => (
  <div className="w-full">
    {/* Hero */}
    <section className="w-full bg-gradient-to-br from-brand-900 to-brand-700 px-6 py-24 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Learn to code by doing — <span className="text-brand-300">right in your browser.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[#C7D8D1]">
          Interactive lessons, DSA practice, personal playgrounds, projects, and live classes —
          all in one calm, browser-first learning environment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register">
            <Button size="lg">Start Learning Free</Button>
          </Link>
          <Link to="/courses">
            <Button size="lg" variant="ghost" className="text-white">
              Explore Courses
            </Button>
          </Link>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="w-full px-6 py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-3">
        {[
          { title: 'Interactive Lessons', desc: 'Read, then write and run code immediately.' },
          { title: 'DSA Practice', desc: 'LeetCode-style practice — no contests, just growth.' },
          { title: 'Browser-First Execution', desc: 'Run JS, Python, SQL safely in your browser.' },
          { title: 'Personal Playground', desc: 'Experiment with your own code anytime.' },
          { title: 'Real Projects', desc: 'Build frontend, React, API, and SQL projects.' },
          { title: 'Live Classes', desc: 'Join Google Meet classes or rewatch recordings.' },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-text-primary">{f.title}</h3>
            <p className="mt-2 text-sm text-text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);
