import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Calendar } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useAuthStore } from '@/shared/store/auth.store';
import { useProgressOverview } from '@/features/progress/hooks/useProgressOverview';
import { classesApi, type ApiMyRecording, type ApiClass } from '@/features/classes/api';

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export const Dashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { overview, courses, loading: progressLoading } = useProgressOverview();
  const [catchUp, setCatchUp] = useState<ApiMyRecording[]>([]);
  const [upcoming, setUpcoming] = useState<ApiClass[]>([]);

  useEffect(() => {
    if (!user) return;
    classesApi
      .myRecordings()
      .then((rows) => setCatchUp(rows.slice(0, 3)))
      .catch(() => {});
    classesApi
      .list('upcoming')
      .then((rows) => setUpcoming(rows.slice(0, 3)))
      .catch(() => {});
  }, [user]);

  // Most recently updated in-progress course, else first completed
  const continueCourse =
    courses.find((c) => c.percentage > 0 && c.percentage < 100) ?? courses[0];

  const statItems = [
    {
      label: 'Lessons Completed',
      value: overview?.lessonsCompleted ?? 0,
    },
    {
      label: 'Problems Solved',
      value: overview?.problemsSolved ?? 0,
    },
    {
      label: 'Day Streak',
      value: user?.streak ?? 0,
    },
    {
      label: 'XP Earned',
      value: (overview?.totalXp ?? user?.xp ?? 0).toLocaleString(),
    },
  ];

  return (
    <div className="w-full p-6 lg:p-8">
      {/* Hero */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 p-8 text-white">
        <p className="text-sm text-[#C7D8D1]">{greetingForNow()} 👋</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">
          Welcome back, {user?.name ?? 'Learner'}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#C7D8D1]">
          Continue your learning journey — pick up where you left off.
        </p>
        <div className="mt-6">
          <Link to="/courses">
            <Button size="lg">Continue Learning</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((s) => (
          <Card key={s.label} className="p-5">
            {progressLoading ? (
              <div className="h-9 w-20 animate-pulse rounded bg-surface-tertiary" />
            ) : (
              <p className="text-3xl font-bold text-brand-500">{s.value}</p>
            )}
            <p className="mt-1 text-sm text-text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Two-column */}
      <div className="mt-6 grid w-full gap-4 lg:grid-cols-3">
        {/* Continue Course */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-text-primary">Continue Course</h2>
          {continueCourse ? (
            <>
              <p className="mt-1 text-sm text-text-muted">{continueCourse.title}</p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${continueCourse.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {continueCourse.completedLessons} / {continueCourse.totalLessons} lessons
              </p>
              <div className="mt-4">
                <Link to={`/courses/${continueCourse.slug}`}>
                  <Button size="sm">Resume</Button>
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-text-muted">
              <Link to="/courses" className="text-brand-500 hover:underline">
                Pick a course
              </Link>{' '}
              to start learning.
            </p>
          )}
        </Card>

        {/* Daily Goal (personal-tracking only, no server model for this yet) */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary">Today</h2>
          <p className="mt-1 text-sm text-text-muted">
            {overview?.activeDays30
              ? `Active ${overview.activeDays30} of the last 30 days`
              : 'Show up and make it count.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-tertiary font-bold text-brand-500">
              🔥
            </div>
            <span className="text-sm text-text-secondary">
              {user?.streak ?? 0} day streak
            </span>
          </div>
        </Card>
      </div>

      {/* Catch Up + Upcoming */}
      <div className="mt-6 grid w-full gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Catch Up</h2>
            <Link
              to="/classes/mine"
              className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {catchUp.length === 0 && (
            <p className="text-sm text-text-muted">No recordings waiting.</p>
          )}

          <div className="flex flex-col gap-3">
            {catchUp.map((r) => (
              <Link
                key={r.class._id}
                to={`/classes/${r.class.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-secondary"
              >
                <PlayCircle size={28} className="shrink-0 text-brand-500" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-text-primary">
                    {r.class.title}
                  </p>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${r.percentWatched}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {r.percentWatched}%
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Upcoming Classes
            </h2>
            <Link
              to="/classes"
              className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {upcoming.length === 0 && (
            <p className="text-sm text-text-muted">No upcoming classes scheduled.</p>
          )}

          <div className="flex flex-col gap-3">
            {upcoming.map((c) => (
              <Link
                key={c._id}
                to={`/classes/${c.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-secondary"
              >
                <Calendar size={24} className="shrink-0 text-brand-500" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-text-primary">
                    {c.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(c.scheduledAt).toLocaleString(undefined, {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    · {c.instructorName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
