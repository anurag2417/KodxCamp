import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Megaphone,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
  Users,
  GraduationCap,
  Video,
  Trophy,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
  useDeleteNotification,
} from '@/features/notifications/hooks/useNotifications';
import type { ApiNotification } from '@/features/notifications/api';
import type { NotificationType } from '@kodxcamp/shared';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { relativeTime } from '@/features/notifications/components/NotificationBell';
import { cn } from '@/shared/lib/utils';
import { useNavigate } from 'react-router-dom';

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

type Tab = 'unread' | 'all';

/**
 * Full notifications page.
 *
 * Two tabs — unread and all. The bell dropdown is a preview; this is
 * the archive. `markAllRead` empties the unread tab in one call.
 */
export const Notifications: React.FC = () => {
  const [tab, setTab] = useState<Tab>('unread');
  const [page, setPage] = useState(1);

  const { notifications, total, pages, loading, error, reload } =
    useNotifications({
      unreadOnly: tab === 'unread',
      page,
      limit: 30,
    });

  const markAll = useMarkAllRead();
  const markRead = useMarkRead();
  const remove = useDeleteNotification();
  const navigate = useNavigate();

  const handleClick = (n: ApiNotification) => {
    if (!n.read) markRead.mutate(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Everything that happened while you were away.
          </p>
        </div>
        {tab === 'unread' && notifications.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <Check size={14} /> Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {(
          [
            { value: 'unread' as const, label: 'Unread' },
            { value: 'all' as const, label: 'All' },
          ]
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setTab(t.value);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t.value
                ? 'border-b-2 border-brand-500 text-brand-500'
                : 'border-b-2 border-transparent text-text-muted hover:text-text-secondary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load notifications"
          message={error}
          onRetry={reload}
        />
      ) : notifications.length === 0 ? (
        <Card className="grid place-items-center py-16 text-center">
          <Bell size={32} className="text-text-muted opacity-40" />
          <p className="mt-3 text-sm text-text-muted">
            {tab === 'unread'
              ? "You're all caught up."
              : 'No notifications yet.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <Card
                key={n._id}
                className={cn(
                  'flex items-start gap-3 p-4 transition-colors',
                  !n.read && 'border-brand-500/40 bg-brand-500/5'
                )}
              >
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {n.title}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-text-secondary">
                      {n.body}
                    </p>
                    <p className="mt-2 text-[11px] text-text-muted">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(n._id)}
                  className="mt-1 shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-xs text-text-muted">
            Page {page} of {pages} · {total} total
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Preferences link */}
      <div className="mt-8 border-t border-border pt-6">
        <Link
          to="/settings/notifications"
          className="text-xs text-brand-500 hover:underline"
        >
          Manage notification preferences →
        </Link>
      </div>
    </div>
  );
};