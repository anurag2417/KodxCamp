import { useState } from 'react';

const questions: [string, string][] = [
  [
    'Do I need to install anything?',
    'No. Everything runs in your browser — including Java, Python, and Ruby. The first time you open a language, its runtime downloads once and then stays cached.',
  ],
  [
    'Which languages can I practice?',
    'JavaScript, TypeScript, Python, Ruby, Java, SQL, HTML, CSS, React, and Tailwind.',
  ],
  [
    'Is there a free tier?',
    'Yes. Every practice problem and every compiler session is free. Courses are priced individually — most are free, and paid courses start at ₹499.',
  ],
  [
    'Can I keep my code?',
    'Yes. Your drafts are saved automatically as you type — even before you sign in. When you sign in, they follow you to your account and appear on every device.',
  ],
  [
    'How does the AI evaluation work?',
    'When you submit a project, AI reviews your code against the specification your instructor wrote — and if the project renders in a browser, AI also looks at screenshots. The instructor\'s review is what determines the final grade. The AI is context, not a replacement.',
  ],
];

/**
 * Five questions a visitor actually asks.
 *
 * Replaces the previous generic three (What is KodxCamp? / Can I
 * practice code in the browser? / Is there a roadmap?) which said
 * nothing a visitor couldn't guess from the rest of the page.
 */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="kc-section kc-faq" id="faq">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">Questions</span>
        <h2>Answers to what you&rsquo;re probably wondering.</h2>
      </div>
      <div className="kc-faq-list">
        {questions.map((item, index) => (
          <button
            key={item[0]}
            type="button"
            className={`kc-faq-item ${open === index ? 'is-open' : ''}`}
            onClick={() => setOpen(open === index ? null : index)}
            aria-expanded={open === index}
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