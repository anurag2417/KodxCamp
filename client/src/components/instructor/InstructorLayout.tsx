import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Users, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';

const tabs = [
  { to: '/instructor', label: 'My Courses', icon: BookOpen, end: true },
  { to: '/instructor/students', label: 'Students', icon: Users, disabled: true },
  { to: '/instructor/upload', label: 'Upload Recordings', icon: Upload, disabled: true },
];

export const InstructorLayout: React.FC = () => (
  <div className="w-full">
    <div className="w-full border-b border-border bg-surface">
      <div className="flex w-full items-center gap-1 overflow-x-auto px-6">
        {tabs.map(({ to, label, icon: Icon, end, disabled }) =>
          disabled ? (
            <span
              key={to}
              title="Coming soon"
              className="flex shrink-0 cursor-not-allowed items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-text-muted/50"
            >
              <Icon size={14} />
              {label}
            </span>
          ) : (
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
          )
        )}
      </div>
    </div>

    <div className="w-full">
      <Outlet />
    </div>
  </div>
);