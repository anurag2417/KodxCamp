import { motion } from 'framer-motion';

const steps: [string, string, string][] = [
  ['01', 'Choose a path', 'Pick a roadmap that matches what you want to build.'],
  ['02', 'Write code', 'Practice concepts inside focused coding sessions.'],
  ['03', 'Ship projects', 'Turn your progress into real, working software.'],
];

export default function HowItWorks() {
  return (
    <section className="kc-section kc-how" id="roadmap">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">How it works</span>
        <h2>A simple path from idea to code.</h2>
      </div>
      <div className="kc-steps">
        {steps.map((step, index) => (
          <motion.div
            key={step[0]}
            className="kc-step"
            initial={{ opacity: 0, x: index % 2 ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
          >
            <span className="kc-step-number">{step[0]}</span>
            <div>
              <h3>{step[1]}</h3>
              <p>{step[2]}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}