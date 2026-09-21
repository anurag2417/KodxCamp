import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { Button } from '@/shared/components/ui/Button';
import { UserMenu } from '@/shared/components/layout/UserMenu';
import { MobileNav } from '@/shared/components/layout/MobileNav';
import { useAuthStore } from '@/shared/store/auth.store';
import { cn } from '@/shared/lib/utils';

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

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-6">
          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-tertiary lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">
                K
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-text-primary sm:inline">
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
                    isActive
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
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:inline-flex">
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
