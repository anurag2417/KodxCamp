import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';

export const Hero: React.FC = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-[#0d3d42] to-brand-700">
    {/* Animated background orbs */}
    <div
      className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl hero-orb-a"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl hero-orb-b"
      aria-hidden="true"
    />

    {/* Subtle grid overlay */}
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
      aria-hidden="true"
    />

    <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        {/* Left: copy */}
        <div className="hero-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-300 backdrop-blur">
            <Sparkles size={12} />
            <span>Browser-first · No installs · No contests</span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
            Learn to code by{' '}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                doing
              </span>
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full text-brand-500"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8 Q 50 2, 100 6 T 198 4"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  className="hero-underline"
                />
              </svg>
            </span>
            <br />
            not by watching.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-[#C7D8D1] md:text-xl">
            Interactive lessons, DSA practice, live projects, and classes — all
            in the browser. Write real code, run real tests, build real things.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg" className="group">
                Start Learning Free
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </Link>
            <Link to="/courses">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <Play size={16} />
                Explore Courses
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm text-[#8BBB92]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
              Free forever tier
            </div>
          </div>
        </div>

        {/* Right: floating code mockup */}
        <div className="hero-float-in hidden lg:block">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-500/30 to-brand-300/20 opacity-60 blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#06191D] shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-[#1B4844] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#F07178]" />
                <span className="h-3 w-3 rounded-full bg-[#EBCB7A]" />
                <span className="h-3 w-3 rounded-full bg-[#8BBB92]" />
                <span className="ml-3 text-xs text-[#88A39A]">
                  two-sum.js
                </span>
              </div>
              <pre className="overflow-hidden p-5 font-mono text-sm leading-relaxed">
                <code>
                  <span className="text-[#88A39A]">{'// Find two numbers that add to target'}</span>
                  {'\n'}
                  <span className="text-[#8BBB92]">function</span>{' '}
                  <span className="text-white">twoSum</span>
                  <span className="text-[#C7D8D1]">(</span>
                  <span className="text-[#EBCB7A]">nums</span>
                  <span className="text-[#C7D8D1]">, </span>
                  <span className="text-[#EBCB7A]">target</span>
                  <span className="text-[#C7D8D1]">) {'{'}</span>
                  {'\n  '}
                  <span className="text-[#8BBB92]">const</span>{' '}
                  <span className="text-white">seen</span>{' '}
                  <span className="text-[#C7D8D1]">= </span>
                  <span className="text-[#8BBB92]">new</span>{' '}
                  <span className="text-white">Map</span>
                  <span className="text-[#C7D8D1]">();</span>
                  {'\n  '}
                  <span className="text-[#8BBB92]">for</span>{' '}
                  <span className="text-[#C7D8D1]">(</span>
                  <span className="text-[#8BBB92]">let</span>{' '}
                  <span className="text-white">i</span>{' '}
                  <span className="text-[#C7D8D1]">= 0; i &lt; nums.length; i++) {'{'}</span>
                  {'\n    '}
                  <span className="text-[#8BBB92]">const</span>{' '}
                  <span className="text-white">diff</span>{' '}
                  <span className="text-[#C7D8D1]">= target - nums[i];</span>
                  {'\n    '}
                  <span className="text-[#8BBB92]">if</span>{' '}
                  <span className="text-[#C7D8D1]">(seen.has(diff)) </span>
                  <span className="text-[#8BBB92]">return</span>{' '}
                  <span className="text-[#C7D8D1]">[seen.get(diff), i];</span>
                  {'\n    '}
                  <span className="text-white">seen.set</span>
                  <span className="text-[#C7D8D1]">(nums[i], i);</span>
                  {'\n  '}
                  <span className="text-[#C7D8D1]">{'}'}</span>
                  {'\n'}
                  <span className="text-[#C7D8D1]">{'}'}</span>
                </code>
              </pre>
              {/* Success pill floating */}
              <div className="absolute -bottom-4 -right-4 rounded-xl border border-[var(--color-success)]/40 bg-[#06191D] px-4 py-3 shadow-xl hero-pulse">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/20">
                    <svg
                      className="h-3.5 w-3.5 text-[var(--color-success)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#88A39A]">
                      Accepted
                    </p>
                    <p className="text-xs font-semibold text-white">
                      All 10 tests passed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom curve */}
    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />
  </section>
);