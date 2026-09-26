import { motion } from 'framer-motion';

const features = [
  {
    number: '01',
    title: 'Learn by doing',
    text: 'Every lesson ends with code you run in the browser. Interactive challenges guide you through one concept at a time.',
  },
  {
    number: '02',
    title: 'Practice with feedback',
    text: 'Submit a solution and see exactly which tests passed, which failed, and why. AI evaluates project submissions against the specification your instructor wrote.',
  },
  {
    number: '03',
    title: 'Build real projects',
    text: 'Multi-file projects with live preview, automated tests, and instructor review. Everything you build becomes part of your portfolio.',
  },
];

/**
 * The learning loop.
 *
 * Three cards. Each answers one question: what you do, what you get
 * back, what you end up with.
 */
export default function FeatureGrid() {
  return (
    <section className="kc-section kc-features" id="practice">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">How it works</span>
        <h2>Less watching. More building.</h2>
      </div>
      <div className="kc-feature-grid">
        {features.map((feature, index) => (
          <motion.article
            key={feature.number}
            className="kc-feature-card"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
          >
            <span>{feature.number}</span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}