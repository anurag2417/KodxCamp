import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  X,
  Home,
  Map,
  Zap,
  Terminal,
  LayoutDashboard,
  BookOpen,
  Rocket,
  FolderKanban,
  Video,
  PlayCircle,
  TrendingUp,
  Trophy,
  Flame,
  Shield,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/auth.store';

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
  instructorOnly?: boolean;
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

/**
 * Mobile navigation drawer.
 *
 * Master Spec, section 26 — Mobile Navigation:
 *   - Global nav collapses to a drawer.
 *   - Inside a workspace, contextual tabs replace the drawer.
 *   - No permanent mobile sidebar.
 *
 * Two groups: the public surface (visible always), and the signed-in
 * surface (visible only when authenticated). Admin/instructor links
 * appear at the bottom for the roles that can use them.
 */
const groups: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Home', icon: Home, end: true },
      { to: '/roadmaps', label: 'Roadmaps', icon: Map },
      { to: '/practice', label: 'Practice', icon: Zap },
      { to: '/playground', label: 'Compiler', icon: Terminal },
    ],
  },
  {
    heading: 'My Learning',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        requiresAuth: true,
      },
      {
        to: '/courses',
        label: 'Courses',
        icon: BookOpen,
        requiresAuth: true,
      },
      {
        to: '/projects',
        label: 'Projects',
        icon: Rocket,
        requiresAuth: true,
      },
      {
        to: '/projects/mine',
        label: 'My Projects',
        icon: FolderKanban,
        requiresAuth: true,
      },
      {
        to: '/classes',
        label: 'Live Classes',
        icon: Video,
        requiresAuth: true,
      },
      {
        to: '/classes/mine',
        label: 'Catch Up',
        icon: PlayCircle,
        requiresAuth: true,
      },
      {
        to: '/progress',
        label: 'Progress',
        icon: TrendingUp,
        requiresAuth: true,
      },
      {
        to: '/achievements',
        label: 'Achievements',
        icon: Trophy,
        requiresAuth: true,
      },
      { to: '/streak', label: 'Streak', icon: Flame, requiresAuth: true },
    ],
  },
  {
    heading: 'Staff',
    items: [
      {
        to: '/instructor',
        label: 'Instructor Panel',
        icon: GraduationCap,
        end: true,
        instructorOnly: true,
      },
      {
        to: '/admin',
        label: 'Admin Panel',
        icon: Shield,
        end: true,
        adminOnly: true,
      },
    ],
  },
];

export const MobileNav: React.FC<Props> = ({ open, onClose }) => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor' || isAdmin;

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

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => {
        if (i.adminOnly && !isAdmin) return false;
        if (i.instructorOnly && !isInstructor) return false;
        if (i.requiresAuth && !user) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

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

        <div className="flex flex-col gap-6 p-4">
          {visibleGroups.map((group, gi) => (
            <div key={gi}>
              {group.heading && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {group.heading}
                </p>
              )}
              <nav className="flex flex-col gap-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
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
                          className={cn(
                            isActive ? 'text-brand-500' : 'text-text-muted'
                          )}
                        />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};