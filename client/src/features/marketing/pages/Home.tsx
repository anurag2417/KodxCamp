import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Seo } from '../../../shared/components/seo/Seo';
import { Hero } from '../components/Hero';
import { StatsMarquee } from '../components/StatsMarquee';
import { FeatureGrid } from '../components/FeatureGrid';
import { CodePreview } from '../components/CodePreview';
import { PinnedHowItWorks } from '../components/PinnedHowItWorks';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { Faq } from '../components/Faq';
import { ScrollProgress } from '../components/ScrollProgress';

export const Home: React.FC = () => (
  <>
    <Seo
      title="Learn to code by doing"
      description="Interactive lessons, DSA practice, live projects, and classes — all in the browser. Write real code, run real tests, build real things."
    />

    <ScrollProgress />

    <div className="w-full">
      <Hero />
      <StatsMarquee />
      <FeatureGrid />
      <CodePreview />
      <PinnedHowItWorks />
      <Testimonials />
      <Pricing />
      <Faq />

      {/* Final CTA */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-brand-900 via-[#0d3d42] to-brand-700 py-32">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="hero-mesh-1 absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-brand-500/30 blur-[100px]" />
          <div className="hero-mesh-2 absolute right-[-15%] bottom-[-15%] h-[50vw] w-[50vw] rounded-full bg-[#0d7a9c]/25 blur-[100px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1200px] px-6 text-center md:px-16">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            Ready to write your first line?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#C7D8D1]">
            Create a free account and start a course in under a minute. No
            card, no trial, no fine print.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="group shadow-2xl shadow-brand-500/40">
                Start Learning Free
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="ghost"
                className="border border-white/15 text-white hover:bg-white/10"
              >
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  </>
);