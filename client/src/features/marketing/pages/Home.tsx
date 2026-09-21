import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Seo } from '../../../shared/components/seo/Seo';
import { Hero } from '../components/Hero';
import { FeatureGrid } from '../components/FeatureGrid';
import { CodePreview } from '../components/CodePreview';
import { HowItWorks } from '../components/HowItWorks';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { Faq } from '../components/Faq';

export const Home: React.FC = () => (
  <>
    <Seo
      title="Learn to code by doing"
      description="Interactive lessons, DSA practice, live projects, and classes — all in the browser. Write real code, run real tests, build real things."
    />

    <div className="w-full">
      <Hero />
      <FeatureGrid />
      <CodePreview />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Faq />

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-[#0d3d42] to-brand-700 py-24">
        <div
          className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl hero-orb-a"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl hero-orb-b"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Ready to write your first line?
          </h2>
          <p className="mt-6 text-lg text-[#C7D8D1]">
            Create a free account and start a course in under a minute. No card,
            no trial, no fine print.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="group">
                Start Learning Free
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10"
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