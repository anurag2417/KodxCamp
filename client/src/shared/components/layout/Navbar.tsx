import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { useAuthStore } from '../../store/auth.store';
import { useIsMarketingRoute } from '../../hooks/useIsMarketingRoute';
import { useScrolled } from '../../hooks/useScrolled';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/courses', label: 'Courses' },
  { to: '/practice', label: 'Practice' },
  { to: '/playground', label: 'Playground' },
  { to: '/projects', label: 'Projects' },
  { to: '/classes', label: 'Classes' },
];

export const Navbar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMarketing = useIsMarketingRoute();
  const scrolled = useScrolled(8);

  // On the marketing landing page, when the user hasn't scrolled yet,
  // we render the navbar transparently over the hero. Once scrolled
  // (or on any other route), it becomes the standard solid bar.
  const transparent = isMarketing && !scrolled;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-colors duration-300',
          transparent
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-border bg-surface/90 backdrop-blur'
        )}
      >
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-6">
          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className={cn(
                'rounded-lg p-2 transition-colors lg:hidden',
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-text-muted hover:bg-surface-tertiary'
              )}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">
                K
              </div>
              <span
                className={cn(
                  'hidden text-lg font-bold tracking-tight sm:inline',
                  transparent ? 'text-white' : 'text-text-primary'
                )}
              >
                KODX<span className="text-brand-500">CAMP</span>
              </span>
            </Link>
          </div>

          {/* Center: desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    transparent
                      ? isActive
                        ? 'text-brand-300'
                        : 'text-white/80 hover:text-white'
                      : isActive
                        ? 'text-brand-500'
                        : 'text-text-muted hover:text-brand-700 dark:hover:text-brand-300'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: theme + user */}
          <div className="flex items-center gap-2">
            <ThemeToggle transparent={transparent} />
            {user ? (
              <UserMenu transparent={transparent} />
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant={transparent ? 'ghost' : 'ghost'}
                    size="sm"
                    className={transparent ? 'text-white hover:bg-white/10' : ''}
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup" className="hidden sm:inline-flex">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};