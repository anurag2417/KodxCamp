import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { AnimatedText } from './AnimatedText';
import { MagneticButton } from './MagneticButton';
import { useParallax } from '../hooks/useParallax';

export const Hero: React.FC = () => {
  const { ref: mockupRef, progress } = useParallax<HTMLDivElement>();

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-brand-900 via-[#0d3d42] to-brand-700">
      {/* Animated gradient mesh */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="hero-mesh-1 absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-brand-500/30 blur-[100px]" />
        <div className="hero-mesh-2 absolute right-[-15%] top-[10%] h-[50vw] w-[50vw] rounded-full bg-[#0d7a9c]/25 blur-[100px]" />
        <div className="hero-mesh-3 absolute bottom-[-20%] left-[20%] h-[55vw] w-[55vw] rounded-full bg-brand-300/20 blur-[100px]" />
      </div>

      {/* Noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-[1600px] items-center gap-12 px-6 pb-32 pt-36 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-16 lg:pb-40 lg:pt-44">
        {/* Left column */}
        <div>
          <div className="hero-fade-in inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-brand-300 backdrop-blur">
            <Sparkles size={12} className="animate-pulse" />
            <span>Browser-first · No installs · No contests</span>
          </div>

          <AnimatedText
            as="h1"
            stagger={70}
            delay={200}
            className="mt-8 max-w-[18ch] text-5xl font-bold leading-[0.98] tracking-tight text-white md:text-7xl lg:text-[5.5rem]"
          >
            Learn to code by doing.
          </AnimatedText>

          <p className="hero-fade-in mt-8 max-w-xl text-lg leading-relaxed text-[#C7D8D1] md:text-xl" style={{ animationDelay: '700ms' }}>
            Interactive lessons, DSA practice, live projects, and classes — all
            in the browser. Write real code, run real tests, build real things.
          </p>

          <div className="hero-fade-in mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: '900ms' }}>
            <MagneticButton>
              <Link to="/register">
                <Button size="lg" className="group shadow-2xl shadow-brand-500/40">
                  Start Learning Free
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Button>
              </Link>
            </MagneticButton>

            <MagneticButton strength={0.2}>
              <Link to="/courses">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border border-white/15 text-white hover:bg-white/10"
                >
                  <Play size={16} />
                  Explore Courses
                </Button>
              </Link>
            </MagneticButton>
          </div>

          <div className="hero-fade-in mt-10 flex flex-wrap items-center gap-6 text-sm text-[#8BBB92]" style={{ animationDelay: '1100ms' }}>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
              Free forever tier
            </span>
          </div>
        </div>

        {/* Right column: parallax code mockup */}
        <div
          ref={mockupRef}
          className="hero-float-in relative hidden lg:block"
          style={{
            transform: `translate3d(0, ${progress * -30}px, 0)`,
            transition: 'transform 100ms linear',
          }}
        >
          {/* Glow behind */}
          <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-tr from-brand-500/40 via-brand-300/20 to-transparent opacity-70 blur-3xl" />

          {/* Floating chip: top-left */}
          <div className="hero-chip-1 absolute -left-8 top-12 z-20 rounded-xl border border-white/10 bg-[#06191D]/90 px-4 py-3 shadow-2xl backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-[#88A39A]">
              Language
            </p>
            <p className="text-xs font-semibold text-white">Python 3.12</p>
          </div>

          {/* Floating chip: right */}
          <div className="hero-chip-2 absolute -right-8 top-1/3 z-20 rounded-xl border border-white/10 bg-[#06191D]/90 px-4 py-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
              <p className="text-xs font-semibold text-white">Runtime ready</p>
            </div>
          </div>

          {/* Code card */}
          <div className="relative z-10 rounded-2xl border border-white/10 bg-[#06191D] shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-[#1B4844] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#F07178]" />
              <span className="h-3 w-3 rounded-full bg-[#EBCB7A]" />
              <span className="h-3 w-3 rounded-full bg-[#8BBB92]" />
              <span className="ml-3 font-mono text-xs text-[#88A39A]">
                two-sum.js
              </span>
            </div>
            <pre className="overflow-hidden p-6 font-mono text-[13px] leading-relaxed">
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

            {/* Success pill */}
            <div className="absolute -bottom-5 -right-5 z-20 rounded-2xl border border-[var(--color-success)]/40 bg-[#06191D] px-4 py-3 shadow-2xl hero-pulse">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-success)]/20">
                  <svg
                    className="h-4 w-4 text-[var(--color-success)]"
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

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />
    </section>
  );
};