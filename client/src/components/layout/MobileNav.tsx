import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  BookOpen,
  Zap,
  Terminal,
  Rocket,
  FolderKanban,
  Video,
  PlayCircle,
  TrendingUp,
  Trophy,
  Flame,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/practice', label: 'Practice', icon: Zap },
  { to: '/playground', label: 'Playground', icon: Terminal },
  { to: '/projects', label: 'Projects', icon: Rocket, end: true },
  { to: '/projects/mine', label: 'My Projects', icon: FolderKanban, requiresAuth: true },
  { to: '/classes', label: 'Live Classes', icon: Video, end: true },
  { to: '/classes/mine', label: 'Catch Up', icon: PlayCircle, requiresAuth: true },
  { to: '/progress', label: 'Progress', icon: TrendingUp, requiresAuth: true },
  { to: '/achievements', label: 'Achievements', icon: Trophy, requiresAuth: true },
  { to: '/streak', label: 'Streak', icon: Flame, requiresAuth: true },
  { to: '/admin', label: 'Admin Panel', icon: Shield, end: true, adminOnly: true },
];

export const MobileNav: React.FC<Props> = ({ open, onClose }) => {
  const user = useAuthStore((s) => s.user);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const visible = items.filter((i) => {
    if (i.adminOnly && user?.role !== 'admin') return false;
    if (i.requiresAuth && !user) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-surface-secondary">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <span className="text-lg font-bold tracking-tight text-text-primary">
            KODX<span className="text-brand-500">CAMP</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-tertiary"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {visible.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-tertiary text-brand-700 dark:text-white'
                    : 'text-text-secondary hover:bg-surface-tertiary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(isActive ? 'text-brand-500' : 'text-text-muted')}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
};