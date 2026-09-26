import { motion } from 'framer-motion';

const testimonials: [string, string, string][] = [
  [
    'Aarav',
    'Learning JavaScript',
    'The practice-first flow finally made coding feel active instead of passive.',
  ],
  [
    'Mira',
    'Learning React',
    'The interface gets out of the way and lets me focus on building.',
  ],
];

/**
 * Two learner notes.
 *
 * Kept at two. A third fabricated quote is worse than two real ones.
 * Role labels are specific ("Learning JavaScript") rather than
 * categorical ("Student") so a visitor can imagine being that person.
 */
export default function Testimonials() {
  return (
    <section className="kc-section kc-testimonials">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">Learner notes</span>
        <h2>Built around the way people actually learn.</h2>
      </div>
      <div className="kc-testimonial-grid">
        {testimonials.map((item, index) => (
          <motion.article
            key={item[0]}
            className="kc-testimonial"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
          >
            <p>&ldquo;{item[2]}&rdquo;</p>
            <div>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}