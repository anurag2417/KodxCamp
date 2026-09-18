import { Link } from 'react-router-dom';
import {
  BookOpen, Zap, Rocket, Video, Flame, Trophy, Clock,
} from 'lucide-react';
import { useProgressOverview } from '../hooks/useProgressOverview';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/progress/StatCard';
import { XPBar } from '../components/progress/XPBar';
import { StreakFlame } from '../components/progress/StreakFlame';
import { ActivityHeatmap } from '../components/progress/ActivityHeatmap';
import { ProgressRing } from '../components/progress/ProgressRing';
import { useAuthStore } from '../store/auth.store';

export const Progress: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { overview, courses, difficulty, weekly, heatmap, activity, loading, error } =
    useProgressOverview();

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="w-full p-8">
        <p className="text-[var(--color-error)]">{error ?? 'Failed to load'}</p>
      </div>
    );
  }

  const maxWeekXp = Math.max(1, ...weekly.map((w) => w.xp));
  const totalSolved =
    difficulty ? difficulty.easy + difficulty.medium + difficulty.hard : 0;

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Your Progress</h1>
        <p className="mt-1 text-sm text-text-muted">
          Everything you've learned, built, and solved.
        </p>
      </div>

      {/* Hero row: XP + Streak */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <XPBar xp={overview.totalXp} />
        </Card>
        <Card className="flex items-center justify-center p-6">
          <StreakFlame streak={user?.streak ?? 0} />
        </Card>
      </div>

      {/* Stat grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lessons"
          value={overview.lessonsCompleted}
          hint={`${overview.coursesInProgress} courses in progress`}
          icon={<BookOpen size={18} />}
        />
        <StatCard
          label="Problems Solved"
          value={overview.problemsSolved}
          hint={`${overview.problemsAttempted} attempted`}
          icon={<Zap size={18} />}
        />
        <StatCard
          label="Projects"
          value={overview.projectsCompleted}
          hint={`${overview.projectsStarted} started`}
          icon={<Rocket size={18} />}
        />
        <StatCard
          label="Classes"
          value={overview.classesAttended}
          hint={`${overview.recordingsWatched} recordings finished`}
          icon={<Video size={18} />}
        />
      </div>

      {/* Heatmap */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Activity</h2>
          <span className="text-xs text-text-muted">
            {overview.activeDays30} active days in last 30
          </span>
        </div>
        <ActivityHeatmap data={heatmap} />
      </Card>

      {/* Two-column: weekly XP + difficulty */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Weekly XP (last 12 weeks)
          </h2>
          <div className="flex h-40 items-end gap-2">
            {weekly.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-500 transition-all"
                  style={{
                    height: `${Math.max(4, (w.xp / maxWeekXp) * 100)}%`,
                  }}
                  title={`${w.xp} XP · ${w.activities} activities`}
                />
                <span className="text-[9px] text-text-muted">
                  {i === weekly.length - 1 ? 'Now' : `-${weekly.length - 1 - i}w`}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Difficulty Breakdown
          </h2>
          {totalSolved === 0 ? (
            <p className="text-sm text-text-muted">Solve problems to see stats.</p>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-brand-500">{totalSolved}</span>
                <span className="mt-1 text-xs text-text-muted">solved</span>
              </div>
              <div className="w-full space-y-3">
                {[
                  { label: 'Easy', value: difficulty?.easy ?? 0, color: '#2A835F' },
                  { label: 'Medium', value: difficulty?.medium ?? 0, color: '#C58A24' },
                  { label: 'Hard', value: difficulty?.hard ?? 0, color: '#C65353' },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>{d.label}</span>
                      <span>{d.value}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalSolved ? (d.value / totalSolved) * 100 : 0}%`,
                          background: d.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Course progress list */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Course Progress
          </h2>
          {courses.length === 0 && (
            <p className="text-sm text-text-muted">
              <Link to="/courses" className="text-brand-500 hover:underline">
                Start a course
              </Link>{' '}
              to track progress.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {courses.map((c) => (
              <Link
                key={c.courseId}
                to={`/courses/${c.slug}`}
                className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-surface-secondary"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{c.title}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {c.completedLessons}/{c.totalLessons}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Recent Activity
          </h2>
          {activity.length === 0 && (
            <p className="text-sm text-text-muted">No activity yet.</p>
          )}
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {activity.slice(0, 10).map((a) => (
              <div
                key={a._id}
                className="flex items-start gap-2 rounded-lg p-2 text-xs"
              >
                <Clock size={12} className="mt-0.5 shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  {a.link ? (
                    <Link
                      to={a.link}
                      className="line-clamp-1 text-text-primary hover:text-brand-500"
                    >
                      {a.title || a.type}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 text-text-primary">
                      {a.title || a.type}
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted">
                    {new Date(a.createdAt).toLocaleDateString()}
                    {a.xp > 0 && ` · +${a.xp} XP`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CTA row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/achievements">
          <Card className="flex items-center gap-3 p-5 transition-all hover:border-brand-500/60">
            <Trophy size={28} className="text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-text-primary">Achievements</p>
              <p className="text-xs text-text-muted">View your badges</p>
            </div>
          </Card>
        </Link>
        <Link to="/streak">
          <Card className="flex items-center gap-3 p-5 transition-all hover:border-brand-500/60">
            <Flame size={28} className="text-orange-400" />
            <div>
              <p className="text-sm font-semibold text-text-primary">Streak</p>
              <p className="text-xs text-text-muted">Keep the fire going</p>
            </div>
          </Card>
        </Link>
        <Link to="/practice">
          <Card className="flex items-center gap-3 p-5 transition-all hover:border-brand-500/60">
            <Zap size={28} className="text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-text-primary">Practice More</p>
              <p className="text-xs text-text-muted">Solve another problem</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};