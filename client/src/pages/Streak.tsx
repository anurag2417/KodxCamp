import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProgressOverview } from '../hooks/useProgressOverview';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { StreakFlame } from '../components/progress/StreakFlame';
import { ActivityHeatmap } from '../components/progress/ActivityHeatmap';
import { useAuthStore } from '../store/auth.store';

export const Streak: React.FC = () => {
  const { heatmap, overview, loading } = useProgressOverview();
  const user = useAuthStore((s) => s.user);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-text-primary">Streak</h1>
      <p className="mt-1 text-sm text-text-muted">
        Show up every day — even 5 minutes counts.
      </p>

      <Card className="mt-6 flex flex-col items-center gap-6 p-8 sm:flex-row sm:justify-around">
        <StreakFlame streak={0} />
        <div className="text-center sm:text-left">
          <p className="text-sm text-text-muted">Active days (30d)</p>
          <p className="mt-1 text-3xl font-bold text-brand-500">
            {overview?.activeDays30 ?? 0}
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm text-text-muted">Total activities</p>
          <p className="mt-1 text-3xl font-bold text-brand-500">
            {overview?.totalActivities ?? 0}
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm text-text-muted">Total XP</p>
          <p className="mt-1 text-3xl font-bold text-brand-500">
            {(overview?.totalXp ?? 0).toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Last 12 months
        </h2>
        <ActivityHeatmap data={heatmap} />
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          How to keep the streak alive
        </h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>• Complete a lesson (any lesson counts)</li>
          <li>• Solve a DSA problem</li>
          <li>• Save or complete a project</li>
          <li>• Attend a live class or finish a recording</li>
          <li>• Just log in — even that counts</li>
        </ul>
        {user && (
          <p className="mt-4 text-xs text-text-muted">
            Current streak: <strong className="text-brand-500">{user.streak ?? 0} days</strong>
          </p>
        )}
      </Card>
    </div>
  );
};