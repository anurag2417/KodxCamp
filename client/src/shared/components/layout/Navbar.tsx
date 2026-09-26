import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useAuthStore } from '../../store/auth.store';
import { useIsMarketingRoute } from '../../hooks/useIsMarketingRoute';
import { useScrolled } from '../../hooks/useScrolled';
import { withNext } from '@/features/auth/lib/redirect';
import { cn } from '../../lib/utils';

/**
 * Public + student navigation.
 *
 * Master Spec, section 2 — Public Navigation:
 *   Home · Roadmaps · Practice · Compiler · [Login / Get Started]
 *
 * Once signed in, the right side shows the bell (unread count) and
 * the user menu. The left side stays the same so a signed-in student
 * keeps the same map of the product.
 *
 * "Compiler" is the label; the route is `/playground` (Batch 1
 * decision A — keep the URL, change the label).
 *
 * Layout: full-bleed.
 */
const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/roadmaps', label: 'Roadmaps' },
  { to: '/practice', label: 'Practice' },
  { to: '/playground', label: 'Compiler' },
];

export const Navbar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMarketing = useIsMarketingRoute();
  const scrolled = useScrolled(8);
  const location = useLocation();

  const transparent = isMarketing && !scrolled;
  const currentPath = `${location.pathname}${location.search}`;

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
          {/* Left: hamburger + logo */}
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
                end={item.end}
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

          {/* Right: theme + bell + user */}
          <div className="flex items-center gap-2">
            <ThemeToggle transparent={transparent} />
            {user ? (
              <>
                <NotificationBell transparent={transparent} />
                <UserMenu transparent={transparent} />
              </>
            ) : (
              <>
                <Link to={withNext('/login', currentPath)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      transparent ? '!text-white hover:bg-white/10' : ''
                    }
                  >
                    Login
                  </Button>
                </Link>
                <Link
                  to={withNext('/signup', currentPath)}
                  className="hidden sm:inline-flex"
                >
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