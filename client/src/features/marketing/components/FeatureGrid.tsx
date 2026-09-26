import { motion } from 'framer-motion';

const features = [
  {
    number: '01',
    title: 'Learn by doing',
    text: 'Short lessons lead directly into code, challenges, and projects.',
  },
  {
    number: '02',
    title: 'Practice in context',
    text: 'Write, run, test, and improve without leaving the platform.',
  },
  {
    number: '03',
    title: 'Build real things',
    text: 'Turn concepts into portfolio-ready projects with clear milestones.',
  },
];

export default function FeatureGrid() {
  return (
    <section className="kc-section kc-features" id="practice">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">The learning loop</span>
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