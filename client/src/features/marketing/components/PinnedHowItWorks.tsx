import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function PinnedHowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section className="kc-section kc-pinned">
      <div ref={ref} className="kc-pinned-card">
        <motion.div style={{ rotate, y }} className="kc-pinned-object">
          <div className="kc-pinned-face">
            <span>BUILD</span>
            <strong>→</strong>
          </div>
        </motion.div>
        <div>
          <span className="kc-eyebrow">Momentum</span>
          <h2>Every lesson should leave you with something working.</h2>
          <p>Progress becomes visible when every concept turns into an action.</p>
        </div>
      </div>
    </section>
  );
}