import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  LayoutDashboard,
  TrendingUp,
  Trophy,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../lib/utils';

export const UserMenu: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary',
          open && 'bg-surface-tertiary'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
          {initials || <UserIcon size={14} />}
        </span>
        <span className="hidden max-w-[10rem] truncate md:inline">
          {user.name}
        </span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-text-primary">
              {user.name}
            </p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
          </div>

          <div className="p-1">
            <MenuItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClose={() => setOpen(false)} />
            <MenuItem to="/progress" icon={TrendingUp} label="Progress" onClose={() => setOpen(false)} />
            <MenuItem to="/achievements" icon={Trophy} label="Achievements" onClose={() => setOpen(false)} />
          </div>

          <div className="border-t border-border p-1">
            <button
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{
  to: string;
  icon: LucideIcon;
  label: string;
  onClose: () => void;
}> = ({ to, icon: Icon, label, onClose }) => (
  <Link
    to={to}
    role="menuitem"
    onClick={onClose}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
  >
    <Icon size={16} />
    {label}
  </Link>
);