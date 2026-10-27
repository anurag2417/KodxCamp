import { motion } from 'framer-motion';

interface Step {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  badge: string;
}

const steps: Step[] = [
  {
    number: '01',
    badge: 'Select a Track',
    title: 'Choose what you want to master',
    subtitle: 'Structured from beginner fundamentals to production architecture.',
    description:
      'Whether you want to learn web development, master Data Structures & Algorithms, write Python scripts, or query databases with SQL, every path is broken down into bite-sized interactive milestones.',
    imageUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Laptop with code editor and learning material',
  },
  {
    number: '02',
    badge: 'Zero Setup',
    title: 'Code immediately in your browser',
    subtitle: 'Full-featured Monaco editor powered by in-browser runtimes.',
    description:
      'No compiler installation, no Node/Python path setup, no broken dependencies. Run JavaScript, Python (via Pyodide), Ruby, Java (via CheerpJ), and SQLite instantly with live previews for HTML/CSS/React.',
    imageUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'High tech code editor interface',
  },
  {
    number: '03',
    badge: 'Instant Feedback',
    title: 'Pass automated tests & get AI review',
    subtitle: 'Verify correctness against comprehensive test cases in real-time.',
    description:
      'Every challenge and practice problem runs against public and hidden test cases. Complete multi-file projects and receive instant automated checks and AI code evaluations to refine your technique.',
    imageUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Terminal output and code validation test suites',
  },
];

export default function HowItWorks() {
  return (
    <section className="kc-section kc-how-it-works" id="how-it-works">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">The Learning Flow</span>
        <h2>How KodxCamp works.</h2>
        <p
          style={{
            marginTop: 16,
            maxWidth: 640,
            color: 'var(--kc-muted)',
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Three steps from your first syntax error to production-ready confidence.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {steps.map((step, index) => {
          const isEven = index % 2 === 1;
          return (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                alignItems: 'center',
                gap: 40,
                padding: '40px max(24px, 3vw)',
                borderRadius: 28,
                border: '1px solid var(--kc-border)',
                background: 'var(--kc-surface)',
                boxShadow: 'var(--kc-shadow)',
              }}
            >
              {/* Text column */}
              <div style={{ order: isEven ? 2 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(234, 88, 12, 0.12)',
                      color: 'var(--kc-orange)',
                      fontWeight: 800,
                      fontSize: 14,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {step.number}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--kc-blue-bright)',
                    }}
                  >
                    {step.badge}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 'clamp(24px, 2.5vw, 34px)',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: 'var(--kc-text)',
                    lineHeight: 1.15,
                    marginBottom: 10,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--kc-blue-bright)',
                    marginBottom: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {step.subtitle}
                </p>

                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--kc-muted)',
                    lineHeight: 1.7,
                  }}
                >
                  {step.description}
                </p>
              </div>

              {/* Image column */}
              <div
                style={{
                  order: isEven ? 1 : 2,
                  position: 'relative',
                  aspectRatio: '16/10',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid var(--kc-border)',
                }}
              >
                <img
                  src={step.imageUrl}
                  alt={step.imageAlt}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.92) contrast(1.05)',
                    transition: 'transform 0.5s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, transparent 60%, rgba(10, 15, 29, 0.6) 100%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
