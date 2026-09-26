import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import AnimatedText from './AnimatedText';
import MagneticButton from './MagneticButton';

const CodePreview = lazy(() => import('./CodePreview'));

export default function Hero() {
  return (
    <section className="kc-hero" id="top">
      <div className="kc-hero-copy">
        <h1>
          <AnimatedText>Learn by</AnimatedText>
          <AnimatedText delay={0.08} className="kc-gradient-text">
            Building.
          </AnimatedText>
        </h1>

        <p>
          Practice, join live classes, solve challenges, and turn what you
          learn into real projects.
        </p>

        <div className="kc-hero-actions">
          <MagneticButton href="#practice">Get Started →</MagneticButton>
        </div>
      </div>

      <motion.div
        className="kc-hero-visual"
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="kc-orb kc-orb-blue" />
        <div className="kc-orb kc-orb-orange" />
        <Suspense
          fallback={
            <div className="kc-code-scene-fallback">Loading 3D scene…</div>
          }
        >
          <CodePreview />
        </Suspense>
      </motion.div>

      <div className="kc-scroll-hint">
        <span>Scroll to explore</span>
        <i />
      </div>
    </section>
  );
}