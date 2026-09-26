import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Map,
  Zap,
  Rocket,
  Video,
  Users,
  Upload,
  Shield,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/auth.store';

interface Props {
  role: 'instructor' | 'admin';
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavSection {
  heading?: string;
  items: NavItem[];
}

const INSTRUCTOR_SECTIONS: NavSection[] = [
  {
    items: [
      {
        to: '/instructor',
        label: 'Dashboard',
        icon: LayoutDashboard,
        end: true,
      },
      { to: '/instructor/courses', label: 'My Courses', icon: BookOpen },
      { to: '/instructor/cohorts', label: 'My Cohorts', icon: GraduationCap },
      { to: '/instructor/students', label: 'Students', icon: Users },
    ],
  },
];

const ADMIN_SECTIONS: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/admin/roadmaps', label: 'Roadmaps', icon: Map },
      { to: '/admin/problems', label: 'Problems', icon: Zap },
      { to: '/admin/projects', label: 'Projects', icon: Rocket },
      { to: '/admin/classes', label: 'Classes', icon: Video },
    ],
  },
  {
    heading: 'People',
    items: [{ to: '/admin/users', label: 'Users', icon: Users }],
  },
  {
    heading: 'Bulk',
    items: [{ to: '/admin/bulk-import', label: 'Bulk Import', icon: Upload }],
  },
  {
    heading: 'Instructor',
    items: [
      {
        to: '/instructor',
        label: 'Instructor Panel',
        icon: GraduationCap,
        end: true,
      },
    ],
  },
];

export const Sidebar: React.FC<Props> = ({ role }) => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const sections =
    role === 'admin' && isAdmin ? ADMIN_SECTIONS : INSTRUCTOR_SECTIONS;

  return (
    <aside
      className={cn(
        'hidden w-64 shrink-0 flex-col border-r border-border bg-surface-secondary',
        'sticky top-16 h-[calc(100vh-4rem)]',
        'lg:flex'
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          {sections.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {section.heading}
                </p>
              )}
              <nav className="flex flex-col gap-0.5">
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-surface-tertiary text-brand-700 dark:text-brand-300'
                          : 'text-text-secondary hover:bg-surface-tertiary'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
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
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 text-xs">
          {isAdmin ? (
            <>
              <Shield size={14} className="text-brand-500" />
              <span className="font-medium text-text-secondary">
                Signed in as admin
              </span>
            </>
          ) : (
            <>
              <GraduationCap size={14} className="text-brand-500" />
              <span className="font-medium text-text-secondary">
                Instructor
              </span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};