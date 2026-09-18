import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/auth.store';
import { classesApi, type ApiMyRecording, type ApiClass } from '../lib/classes.api';

const stats = [
  { label: 'Lessons Completed', value: '12' },
  { label: 'Problems Solved', value: '38' },
  { label: 'Day Streak', value: '7' },
  { label: 'XP Earned', value: '2,450' },
];

export const Dashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [catchUp, setCatchUp] = useState<ApiMyRecording[]>([]);
  const [upcoming, setUpcoming] = useState<ApiClass[]>([]);

  useEffect(() => {
    if (!user) return;
    classesApi.myRecordings().then((rows) => setCatchUp(rows.slice(0, 3))).catch(() => {});
    classesApi.list('upcoming').then((rows) => setUpcoming(rows.slice(0, 3))).catch(() => {});
  }, [user]);

  return (
    <div className="w-full p-6 lg:p-8">
      {/* Hero */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 p-8 text-white">
        <p className="text-sm text-[#C7D8D1]">Good evening 👋</p>
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
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-3xl font-bold text-brand-500">{s.value}</p>
            <p className="mt-1 text-sm text-text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="mt-6 grid w-full gap-4 lg:grid-cols-3">
        {/* Continue Course */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-text-primary">Continue Course</h2>
          <p className="mt-1 text-sm text-text-muted">JavaScript Fundamentals</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <div className="h-full w-[68%] rounded-full bg-brand-500" />
          </div>
          <p className="mt-2 text-xs text-text-muted">12 / 18 lessons</p>
        </Card>

        {/* Daily Goal */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary">Daily Goal</h2>
          <p className="mt-1 text-sm text-text-muted">Solve 2 DSA problems</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-tertiary text-brand-500 font-bold">
              1/2
            </div>
            <span className="text-sm text-text-secondary">Almost there!</span>
          </div>
        </Card>
      </div>

      {/* Catch Up + Upcoming */}
      <div className="mt-6 grid w-full gap-4 lg:grid-cols-2">
        {/* Catch Up */}
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

        {/* Upcoming */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Upcoming Classes</h2>
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