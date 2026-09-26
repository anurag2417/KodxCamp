import { motion } from 'framer-motion';

const stats = ['Coding challenges', 'Live classes', 'Real projects', 'Career roadmaps'];

export default function StatsMarquee() {
  return (
    <section className="kc-marquee" aria-label="KodxCamp highlights">
      <motion.div
        className="kc-marquee-track"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        {[...stats, ...stats].map((item, index) => (
          <span key={`${item}-${index}`}>
            <i />
            {item}
          </span>
        ))}
      </motion.div>
    </section>
  );
}