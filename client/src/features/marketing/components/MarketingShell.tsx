import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useThemeStore } from '@/shared/store/theme.store';

interface Props {
  children: ReactNode;
}

/**
 * Full-bleed marketing shell.
 *
 * The shell is the whole page: floating pill navbar on top, the
 * routed page in the middle, a navy footer at the bottom. Every
 * wrapper is `w-full`; the landing page itself owns any inner
 * max-width it wants per-section (see `.kc-section` in index.css,
 * which caps text content at 1600px but lets background sections
 * bleed edge-to-edge).
 *
 * Three-part navbar per the spec:
 *   [ Logo ]   [ Home | Practice | Compiler | Roadmap ]   [ Login ]
 *
 * The center pill wraps only the nav links. The theme toggle lives
 * inside the pill on the right, next to Login.
 */
export default function MarketingShell({ children }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const dark = theme === 'dark';

  return (
    <div className="landing-root">
      <header className="kc-nav">
        <Link to="/" className="kc-brand" aria-label="KodxCamp home">
          <span className="kc-brand-mark">
            <span>K</span>
          </span>
          <span>
            Kodx<span>Camp</span>
          </span>
        </Link>

        <div className="kc-nav-center">
          <nav className="kc-nav-links" aria-label="Primary">
            <a className="active" href="#top">
              Home
            </a>
            <a href="#practice">Practice</a>
            <a href="#compiler">Compiler</a>
            <a href="#roadmap">Roadmap</a>
          </nav>
          <button
            type="button"
            className="kc-theme-toggle"
            onClick={toggle}
            aria-label="Toggle color theme"
          >
            <span className="kc-theme-icon">{dark ? '☼' : '◐'}</span>
          </button>
        </div>

        <div className="kc-nav-actions">
          <Link className="kc-login" to="/login">
            Login
          </Link>
        </div>
      </header>

      {children}

      <footer className="kc-footer">
        <div>
          <Link to="/" className="kc-brand">
            <span className="kc-brand-mark">
              <span>K</span>
            </span>
            <span>
              Kodx<span>Camp</span>
            </span>
          </Link>
          <p>Learn by building.</p>
        </div>
        <div className="kc-footer-links">
          <a href="#practice">Practice</a>
          <a href="#compiler">Compiler</a>
          <a href="#roadmap">Roadmap</a>
        </div>
        <span className="kc-footer-copy">
          © {new Date().getFullYear()} KodxCamp
        </span>
      </footer>
    </div>
  );
}