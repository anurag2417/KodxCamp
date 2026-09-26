import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useThemeStore } from '@/shared/store/theme.store';

interface Props {
  children: ReactNode;
}

/**
 * Marketing shell.
 *
 * Floating pill navbar, the routed page in the middle, a navy footer
 * at the bottom.
 *
 * Nav:
 *   [Logo]   Home · Courses · Practice · Compiler · Roadmaps
 *            [theme] [Login] [Sign up]
 *
 * Footer: four columns (brand, learn, company, contact).
 *
 * The "Compiler" link is a route to /playground, not an on-page
 * anchor. The theme toggle sits inside the nav pill.
 */
export default function MarketingShell({ children }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const dark = theme === 'dark';
  const year = new Date().getFullYear();

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
            <Link to="/courses">Courses</Link>
            <a href="#practice">Practice</a>
            <Link to="/playground">Compiler</Link>
            <a href="#roadmap">Roadmaps</a>
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
          <Link className="kc-login kc-login-primary" to="/signup">
            Sign up
          </Link>
        </div>
      </header>

      {children}

      <footer className="kc-footer kc-footer-multi">
        <div className="kc-footer-columns">
          <div className="kc-footer-col kc-footer-col-brand">
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

          <div className="kc-footer-col">
            <p className="kc-footer-heading">Learn</p>
            <Link to="/courses">Courses</Link>
            <Link to="/roadmaps">Roadmaps</Link>
            <Link to="/practice">Practice</Link>
            <Link to="/playground">Compiler</Link>
          </div>

          <div className="kc-footer-col">
            <p className="kc-footer-heading">Company</p>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <a href="mailto:hello@kodxcamp.dev">Contact</a>
          </div>

          <div className="kc-footer-col">
            <p className="kc-footer-heading">Get started</p>
            <Link to="/signup">Create free account</Link>
            <Link to="/login">Sign in</Link>
          </div>
        </div>

        <div className="kc-footer-bottom">
          <span className="kc-footer-copy">
            © {year} KodxCamp · hello@kodxcamp.dev
          </span>
        </div>
      </footer>
    </div>
  );
}