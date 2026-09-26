import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { track } from '@/shared/lib/analytics';
import MarketingShell from '../components/MarketingShell';
import Hero from '../components/Hero';
import FeatureGrid from '../components/FeatureGrid';
import HowItWorks from '../components/HowItWorks';
import PinnedHowItWorks from '../components/PinnedHowItWorks';
import StatsMarquee from '../components/StatsMarquee';
import ScrollProgress from '../components/ScrollProgress';
import FeaturedCourses from '../components/FeaturedCourses';
import Testimonials from '../components/Testimonials';
import Faq from '../components/Faq';

/**
 * Marketing home.
 *
 * Section order:
 *   1. Hero — what we do, primary CTA
 *   2. Marquee — languages supported
 *   3. Feature grid — the learning loop
 *   4. Pinned — the thesis statement
 *   5. How it works — the path a new student takes
 *   6. Featured courses — the actual product
 *   7. Testimonials — proof
 *   8. FAQ — objections answered
 *   9. Bottom glow — visual close
 *
 * Pricing was replaced by FeaturedCourses in Batch 3.2. The previous
 * pricing section said "Start free" without showing anything real.
 * FeaturedCourses fetches the three most recent published courses and
 * renders them as cards, with a placeholder for the empty case.
 */
export default function Home() {
  useEffect(() => {
    track('landing_view');
  }, []);
  return (
    <MarketingShell>
      <ScrollProgress />
      <Hero />
      <StatsMarquee />
      <FeatureGrid />
      <PinnedHowItWorks />
      <HowItWorks />
      <FeaturedCourses />
      <Testimonials />
      <Faq />

      <motion.div
        className="kc-bottom-glow"
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </MarketingShell>
  );
}