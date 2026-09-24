import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Terminal,
  Rocket,
  TrendingUp,
  Trophy,
  Flame,
  FolderKanban,
  Video,
  PlayCircle,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/auth.store';
import { useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'LEARN',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/courses', label: 'Courses', icon: BookOpen },
      { to: '/practice', label: 'Practice', icon: Zap },
      { to: '/playground', label: 'Playground', icon: Terminal },
      { to: '/projects', label: 'Projects', icon: Rocket, end: true },
      { to: '/projects/mine', label: 'My Projects', icon: FolderKanban },
      { to: '/classes', label: 'Live Classes', icon: Video, end: true },
      { to: '/classes/mine', label: 'Catch Up', icon: PlayCircle },
    ],
  },
  {
    title: 'LEARNING',
    items: [
      { to: '/progress', label: 'Progress', icon: TrendingUp },
      { to: '/achievements', label: 'Achievements', icon: Trophy },
      { to: '/streak', label: 'Streak', icon: Flame },
    ],
  },
];

const instructorSection: NavSection = {
  title: 'INSTRUCTOR',
  items: [
    { to: '/instructor', label: 'My Courses', icon: BookOpen, end: true },
  ],
};

const adminSection: NavSection = {
  title: 'ADMIN',
  items: [{ to: '/admin', label: 'Admin Panel', icon: Shield, end: true }],
};

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor' || isAdmin;

  const allSections: NavSection[] = [
    ...sections,
    ...(isInstructor ? [instructorSection] : []),
    ...(isAdmin ? [adminSection] : []),
  ];

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-surface-secondary transition-[width] duration-200 lg:flex',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Scrollable nav region */}
      <div
        className={cn(
          'flex-1 overflow-y-auto',
          collapsed ? 'p-2' : 'p-5'
        )}
      >
        <div className={cn('flex flex-col', collapsed ? 'gap-6' : 'gap-8')}>
          {allSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-3 text-xs font-semibold tracking-widest text-text-muted">
                  {section.title}
                </p>
              )}
              <nav className="flex flex-col gap-1">
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-lg py-2 text-sm font-medium transition-colors',
                        collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                        isActive
                          ? 'bg-surface-tertiary text-brand-700 dark:bg-surface-tertiary dark:text-white'
                          : 'text-text-secondary hover:bg-surface-tertiary dark:hover:bg-surface-secondary'
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
                        {!collapsed && <span>{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with collapse toggle */}
      <div
        className={cn(
          'shrink-0 border-t border-border',
          collapsed ? 'p-2' : 'p-3'
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            'flex w-full items-center rounded-lg py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-tertiary hover:text-text-primary',
            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};