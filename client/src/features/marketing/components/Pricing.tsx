import MagneticButton from './MagneticButton';

/**
 * Final CTA section on the marketing home.
 *
 * `id="pricing"` (not `id="compiler"`) — the previous id was a
 * leftover from when the nav linked here. The nav now links to
 * `/playground` directly, so this section needs no anchor of its own.
 * If a future section wants a pricing anchor, `#pricing` is free.
 */
export default function Pricing() {
  return (
    <section className="kc-section kc-pricing" id="pricing">
      <div className="kc-pricing-card">
        <div>
          <span className="kc-eyebrow">Start free</span>
          <h2>Build your first project today.</h2>
          <p>
            Explore the platform, practice in-browser, and find your learning
            path.
          </p>
        </div>
        <MagneticButton href="#top">Get Started →</MagneticButton>
      </div>
    </section>
  );
}