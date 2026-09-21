import { useEffect, useState } from 'react';
import { Users, BookOpen, Zap, Rocket, Video, TrendingUp } from 'lucide-react';
import { adminApi, type AdminStats } from '@/features/admin/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { StatCard } from '@/features/progress/components/StatCard';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!stats) return null;

  const maxDaily = Math.max(1, ...stats.dailyActivity.map((d) => d.count));

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Admin Overview</h1>
        <p className="mt-1 text-sm text-text-muted">
          Platform-wide activity and content metrics.
        </p>
      </div>

      {/* Top stat row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.users.total}
          hint={`+${stats.users.newLast7d} this week`}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Courses"
          value={stats.content.courses}
          hint={`${stats.content.lessons} lessons`}
          icon={<BookOpen size={18} />}
        />
        <StatCard
          label="Problems"
          value={stats.content.problems}
          hint={`${stats.engagement.submissions} submissions`}
          icon={<Zap size={18} />}
        />
        <StatCard
          label="Projects"
          value={stats.content.projects}
          hint={`${stats.engagement.userProjects} user copies`}
          icon={<Rocket size={18} />}
        />
      </div>

      {/* Engagement row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Acceptance Rate"
          value={`${stats.engagement.acceptanceRate}%`}
          hint={`${stats.engagement.submissionsAccepted}/${stats.engagement.submissions}`}
          icon={<TrendingUp size={18} />}
          accent="success"
        />
        <StatCard
          label="Classes"
          value={stats.content.classesScheduled + stats.content.classesEnded}
          hint={`${stats.content.classesScheduled} scheduled`}
          icon={<Video size={18} />}
        />
        <StatCard
          label="Enrollments"
          value={stats.engagement.enrollments}
          hint="across all classes"
        />
        <StatCard
          label="Activity (7d)"
          value={stats.engagement.activitiesLast7d}
          hint="tracked events"
        />
      </div>

      {/* Daily activity chart */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Daily Activity (30 days)
        </h2>
        <div className="flex h-48 items-end gap-1">
          {stats.dailyActivity.map((d, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-brand-500 transition-all hover:bg-brand-700"
              style={{ height: `${Math.max(2, (d.count / maxDaily) * 100)}%` }}
              title={`${d.day}: ${d.count} events`}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-text-muted">
          <span>{stats.dailyActivity[0]?.day}</span>
          <span>{stats.dailyActivity[stats.dailyActivity.length - 1]?.day}</span>
        </div>
      </div>
    </div>
  );
};
