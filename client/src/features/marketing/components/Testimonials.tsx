import { motion } from 'framer-motion';

const testimonials: [string, string, string][] = [
  [
    'Aarav',
    'Student',
    'The practice-first flow finally made coding feel active instead of passive.',
  ],
  [
    'Mira',
    'Frontend learner',
    'The interface gets out of the way and lets me focus on building.',
  ],
];

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
            <p>“{item[2]}”</p>
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