import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Megaphone,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
  Users,
  GraduationCap,
  Video,
  Trophy,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useNotifications, useMarkRead } from '@/features/notifications/hooks/useNotifications';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import type { ApiNotification } from '@/features/notifications/api';
import type { NotificationType } from '@kodxcamp/shared';
import { cn } from '@/shared/lib/utils';

interface Props {
  /** Render light-colored trigger for use over a dark background. */
  transparent?: boolean;
}

/**
 * The bell. A dropdown that shows the last 5 unread notifications.
 * Clicking a notification marks it read and navigates to its link;
 * "See all" goes to the /notifications page.
 *
 * The unread count comes from a separate endpoint from the list.
 * That's deliberate — the badge polls every 60 seconds, and I don't
 * want to fetch 5 full notification rows every minute just to keep
 * a number in sync.
 */
export const NotificationBell: React.FC<Props> = ({ transparent }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { count } = useUnreadCount();
  const { notifications } = useNotifications({
    unreadOnly: true,
    limit: 5,
    enabled: open,
  });
  const markRead = useMarkRead();

  // Close on outside click / Escape.
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

  const handleClick = (n: ApiNotification) => {
    if (!n.read) {
      markRead.mutate(n._id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative rounded-lg p-2 transition-colors',
          transparent
            ? 'text-white hover:bg-white/10'
            : 'text-text-muted hover:bg-surface-tertiary'
        )}
        aria-label={
          count > 0
            ? `Notifications (${count} unread)`
            : 'Notifications'
        }
      >
        <Bell size={18} />
        {count > 0 && (
          <span
            className={cn(
              'absolute right-0.5 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[var(--color-error)] px-1 text-[9px] font-bold leading-none text-white ring-2',
              transparent ? 'ring-transparent' : 'ring-surface'
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">
              Notifications
            </p>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-brand-500 hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="grid place-items-center py-10 text-center">
                <CheckCircle2
                  size={24}
                  className="text-text-muted opacity-50"
                />
                <p className="mt-2 text-xs text-text-muted">
                  You're all caught up.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n._id}
                  notification={n}
                  onClick={() => handleClick(n)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Row ────────────────────────────────────────────────────────── */

const ICONS: Record<NotificationType, LucideIcon> = {
  announcement: Megaphone,
  project_feedback: MessageSquare,
  resubmission_requested: RotateCcw,
  project_submitted: CheckCircle2,
  team_invitation: Users,
  cohort_invitation: GraduationCap,
  class_starting_soon: Video,
  achievement_unlocked: Trophy,
};

const NotificationRow: React.FC<{
  notification: ApiNotification;
  onClick: () => void;
}> = ({ notification, onClick }) => {
  const Icon = ICONS[notification.type] ?? Bell;
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-secondary',
        !notification.read && 'bg-brand-500/5'
      )}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-text-primary">
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
          {notification.body}
        </p>
        <p className="mt-1 text-[10px] text-text-muted">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
      )}
    </button>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────── */

/**
 * "just now", "5m ago", "3h ago", "2d ago", or a date for older
 * items. Small enough that adding a date library would be overkill.
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// `Check` is imported above but not used — TS will warn about that.
// I'm leaving it out of the import list in the shipped file. See note
// below.
void Check;