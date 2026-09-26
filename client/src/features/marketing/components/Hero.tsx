import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import AnimatedText from './AnimatedText';
import MagneticButton from './MagneticButton';

const CodePreview = lazy(() => import('./CodePreview'));

/**
 * Marketing hero.
 *
 * Two CTAs:
 *   - "Try the compiler" → /playground (public, no account needed)
 *   - "Create free account" → /signup
 *
 * The languages line under the CTAs is deliberately muted — it's
 * scannable, not shouty. A visitor who cares about a specific language
 * finds it in one glance.
 */
export default function Hero() {
  return (
    <section className="kc-hero" id="top">
      <div className="kc-hero-copy">
        <span className="kc-eyebrow">
          <i />
          Browser-first coding education
        </span>

        <h1>
          <AnimatedText>Learn by</AnimatedText>
          <AnimatedText delay={0.08} className="kc-gradient-text">
            Building.
          </AnimatedText>
        </h1>

        <p>
          Write real code, run it in your browser, and get feedback from
          automated tests and AI — no installs, no setup.
        </p>

        <div className="kc-hero-actions">
          <MagneticButton href="/playground">
            Try the compiler →
          </MagneticButton>
          <a href="/signup" className="kc-text-link">
            Create free account <span>→</span>
          </a>
        </div>

        <p
          style={{
            marginTop: 28,
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
          }}
        >
          JavaScript · TypeScript · Python · Ruby · Java · SQL · HTML/CSS ·
          React · Tailwind
        </p>
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