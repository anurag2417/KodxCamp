import { motion } from 'framer-motion';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
  focus: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Aarav Patel',
    role: 'Full-Stack Track',
    focus: 'React & Node.js',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    quote:
      'The practice-first flow finally made coding feel active instead of passive. Building full-stack projects in the browser without getting stuck on local environment bugs was a game-changer.',
  },
  {
    name: 'Mira Sundaram',
    role: 'Frontend Track',
    focus: 'HTML, CSS & Tailwind',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80',
    quote:
      'The interface gets out of the way and lets me focus on building. Seeing live changes immediately as I styled components helped me develop real intuition for web layouts.',
  },
  {
    name: 'Rohan Deshmukh',
    role: 'Software Engineer Prep',
    focus: 'DSA & Python',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    quote:
      'The instant test harness for data structures gives immediate test-case breakdowns. Passing the edge cases and watching my streak grow gave me the discipline to practice every single morning.',
  },
];

export default function Testimonials() {
  return (
    <section className="kc-section kc-testimonials">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">Learner notes</span>
        <h2>Built around the way people actually learn.</h2>
        <p
          style={{
            marginTop: 16,
            maxWidth: 640,
            color: 'var(--kc-muted)',
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Real stories from developers building their skills one line of code at a time.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        {testimonials.map((item, index) => (
          <motion.article
            key={item.name}
            className="kc-testimonial"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 32,
              borderRadius: 24,
              border: '1px solid var(--kc-border)',
              background: 'var(--kc-surface)',
            }}
          >
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.65,
                color: 'var(--kc-text)',
                fontStyle: 'normal',
                marginBottom: 28,
              }}
            >
              &ldquo;{item.quote}&rdquo;
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginTop: 'auto',
                borderTop: '1px solid var(--kc-border)',
                paddingTop: 20,
              }}
            >
              <img
                src={item.avatar}
                alt={item.name}
                loading="lazy"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--kc-border)',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong style={{ fontSize: 15, fontWeight: 700, color: 'var(--kc-text)' }}>
                  {item.name}
                </strong>
                <span style={{ fontSize: 12, color: 'var(--kc-muted)' }}>
                  {item.role} · <span style={{ color: 'var(--kc-blue-bright)' }}>{item.focus}</span>
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
