import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Rocket,
  Video,
  Users,
  Upload,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const tabs = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/problems', label: 'Problems', icon: Zap },
  { to: '/admin/projects', label: 'Projects', icon: Rocket },
  { to: '/admin/classes', label: 'Classes', icon: Video },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/bulk-import', label: 'Bulk Import', icon: Upload },
];

export const AdminLayout: React.FC = () => (
  <div className="w-full">
    <div className="w-full border-b border-border bg-surface">
      <div className="flex w-full items-center gap-1 overflow-x-auto px-6">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              )
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>
    </div>

    <div className="w-full">
      <Outlet />
    </div>
  </div>
);