import { motion } from 'framer-motion';
import MarketingShell from '../components/MarketingShell';
import Hero from '../components/Hero';
import FeatureGrid from '../components/FeatureGrid';
import HowItWorks from '../components/HowItWorks';
import PinnedHowItWorks from '../components/PinnedHowItWorks';
import StatsMarquee from '../components/StatsMarquee';
import ScrollProgress from '../components/ScrollProgress';
import Pricing from '../components/Pricing';
import Testimonials from '../components/Testimonials';
import Faq from '../components/Faq';

export default function Home() {
  return (
    <MarketingShell>
      <ScrollProgress />
      <Hero />
      <StatsMarquee />
      <FeatureGrid />
      <PinnedHowItWorks />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <Pricing />

      <motion.div
        className="kc-bottom-glow"
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </MarketingShell>
  );
}