import { motion } from 'framer-motion';

const languages = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Ruby',
  'Java',
  'SQL',
  'HTML/CSS',
  'React',
  'Tailwind',
];

/**
 * Language marquee.
 *
 * A continuously scrolling list of the languages the platform
 * teaches. Repeats so the eye catches multiple names per glance.
 *
 * The item list is duplicated (rendered twice) so the animation can
 * loop seamlessly — the CSS animation translates the track by -50%,
 * at which point the second copy is exactly where the first started.
 */
export default function StatsMarquee() {
  return (
    <section className="kc-marquee" aria-label="Languages KodxCamp teaches">
      <motion.div
        className="kc-marquee-track"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        {[...languages, ...languages].map((item, index) => (
          <span key={`${item}-${index}`}>
            <i />
            {item}
          </span>
        ))}
      </motion.div>
    </section>
  );
}