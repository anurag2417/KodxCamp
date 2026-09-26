import { useState } from 'react';

const questions: [string, string][] = [
  [
    'What is KodxCamp?',
    'A browser-first platform for learning programming through practice, live learning, and real projects.',
  ],
  [
    'Can I practice code in the browser?',
    'Yes. The product is designed around writing and running code as part of the learning flow.',
  ],
  [
    'Is there a roadmap?',
    'Yes. Roadmaps organize learning into focused steps so you always know what to build next.',
  ],
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="kc-section kc-faq">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">FAQ</span>
        <h2>Simple answers.</h2>
      </div>
      <div className="kc-faq-list">
        {questions.map((item, index) => (
          <button
            key={item[0]}
            type="button"
            className={`kc-faq-item ${open === index ? 'is-open' : ''}`}
            onClick={() => setOpen(open === index ? null : index)}
          >
            <span>{item[0]}</span>
            <strong>{open === index ? '−' : '+'}</strong>
            {open === index && <p>{item[1]}</p>}
          </button>
        ))}
      </div>
    </section>
  );
}