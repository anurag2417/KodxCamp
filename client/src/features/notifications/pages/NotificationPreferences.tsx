import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/hooks/useNotifications';
import type { NotificationPreferenceKey } from '@kodxcamp/shared';
import { Card } from '@/shared/components/ui/Card';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

/**
 * Notification preferences.
 *
 * One toggle per email category. In-app notifications are NOT
 * governed by these — turning off a category only stops email for
 * that category. The bell still shows everything.
 *
 * The `achievement_unlocked` notification type has no toggle here
 * because the server has no preference key for it — it cannot be
 * muted, in-app or by email. See
 * `notificationPreference.service.ts` for the type→category map.
 *
 * Server contract: PATCH accepts a partial object of boolean values.
 * Any key not sent is left unchanged. The server returns the full
 * preferences object, so we don't have to merge optimistically.
 */
const CATEGORIES: {
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Messages your instructors post to your courses and cohorts.',
  },
  {
    key: 'projectFeedback',
    label: 'Project feedback',
    description:
      'When an instructor reviews your project or requests a new submission.',
  },
  {
    key: 'submissions',
    label: 'Submission activity',
    description: 'When your own submissions are recorded or updated.',
  },
  {
    key: 'teamInvites',
    label: 'Team invitations',
    description: 'When you are invited to join a course team.',
  },
  {
    key: 'cohortInvites',
    label: 'Cohort invitations',
    description: 'When you are added to a cohort.',
  },
  {
    key: 'classes',
    label: 'Live classes',
    description: 'Reminders for classes you are enrolled in.',
  },
];

export const NotificationPreferences: React.FC = () => {
  const toast = useToast();
  const { preferences, loading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const toggle = (key: NotificationPreferenceKey, next: boolean) => {
    updateMutation.mutate(
      { [key]: next },
      {
        onError: () => {
          toast.error('Could not save your preference. Try again.');
        },
      },
    );
  };

  if (loading && !preferences) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="w-full p-6 lg:p-8">
        <Link
          to="/notifications"
          className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={14} /> Notifications
        </Link>
        <ErrorState
          title="Couldn't load your preferences"
          message="Try again in a moment."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/notifications"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Notifications
      </Link>

      <div className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-text-primary">
          Notification preferences
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Choose which categories send you email. In-app notifications always
          appear in the bell — these settings only control email.
        </p>
      </div>

      <Card className="max-w-2xl divide-y divide-border p-0">
        {CATEGORIES.map((c) => {
          const enabled = preferences[c.key];
          const saving = updateMutation.isPending;
          return (
            <div
              key={c.key}
              className="flex items-start justify-between gap-6 p-5"
            >
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`pref-${c.key}`}
                  className="block text-sm font-semibold text-text-primary"
                >
                  {c.label}
                </label>
                <p className="mt-1 text-xs text-text-muted">
                  {c.description}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {saving && (
                  <Loader2
                    size={14}
                    className="animate-spin text-text-muted"
                  />
                )}
                <button
                  id={`pref-${c.key}`}
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => toggle(c.key, !enabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                    enabled ? 'bg-brand-500' : 'bg-surface-tertiary',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </Card>

      <p className="mt-4 max-w-2xl text-xs text-text-muted">
        Achievements always notify in-app and never send email. There is no
        toggle for them.
      </p>
    </div>
  );
};