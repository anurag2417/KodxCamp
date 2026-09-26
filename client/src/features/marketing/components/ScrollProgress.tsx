import { motion, useScroll } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="kc-scroll-progress"
      style={{ scaleX: scrollYProgress }}
    />
  );
}