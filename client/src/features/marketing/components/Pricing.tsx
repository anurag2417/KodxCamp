import MagneticButton from './MagneticButton';

export default function Pricing() {
  return (
    <section className="kc-section kc-pricing" id="compiler">
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