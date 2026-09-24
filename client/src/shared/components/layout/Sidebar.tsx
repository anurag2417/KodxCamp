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
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/auth.store';

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
    // Placeholder for future pages - links will resolve once built
    // { to: '/instructor/students', label: 'Students', icon: Users },
  ],
};

const adminSection: NavSection = {
  title: 'ADMIN',
  items: [{ to: '/admin', label: 'Admin Panel', icon: Shield, end: true }],
};

export const Sidebar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor' || isAdmin;

  const allSections: NavSection[] = [
    ...sections,
    ...(isInstructor ? [instructorSection] : []),
    ...(isAdmin ? [adminSection] : []),
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface-secondary lg:block">
      <div className="flex h-full flex-col gap-8 overflow-y-auto p-5">
        {allSections.map((section) => (
          <div key={section.title}>
            <p className="mb-3 text-xs font-semibold tracking-widest text-text-muted">
              {section.title}
            </p>
            <nav className="flex flex-col gap-1">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
  );
};
