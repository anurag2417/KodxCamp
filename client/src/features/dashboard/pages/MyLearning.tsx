import { Link } from 'react-router-dom';
import {
  Play,
  BookOpen,
  Map as MapIcon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/shared/store/auth.store';
import { useProgressOverview } from '@/features/progress/hooks/useProgressOverview';
import { useRoadmaps } from '@/features/roadmaps/hooks/useRoadmaps';
import { useAnnouncementFeed } from '@/features/announcements/hooks/useAnnouncements';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { Card } from '@/shared/components/ui/Card';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';

/**
 * My Learning.
 *
 * Master Spec, section 8:
 *   "After enrollment, the student should be taken to My Learning,
 *    rather than a traditional dashboard."
 *
 * Structure:
 *   - Announcements: recent messages from instructors (top of page).
 *   - Continue Learning: the one course the student was most
 *     recently in.
 *   - My Roadmaps: the roadmaps the student is enrolled in.
 *   - My Courses: the courses the student has started.
 *   - Recent Activity: a small, read-only feed.
 */
export const MyLearning: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { courses, activity, loading, error, reload } =
    useProgressOverview();
  const { roadmaps: allRoadmaps, loading: roadmapsLoading } = useRoadmaps();
  const { announcements, loading: announcementsLoading } =
    useAnnouncementFeed();

  if (loading || roadmapsLoading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-text-primary">My Learning</h1>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load your learning"
            message={error}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  const continueCourse =
    courses.find((c) => c.percentage > 0 && c.percentage < 100) ??
    courses[0];

  const hasStartedAnyCourse = courses.length > 0;
  const myRoadmaps = hasStartedAnyCourse ? allRoadmaps : [];

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
          My Learning
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          Pick up where you left off.
        </p>
      </div>

      {/* ─── Announcements ─────────────────────────────── */}
      {!announcementsLoading && announcements.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            Announcements
          </h2>
          <div className="flex flex-col gap-3">
            {announcements.slice(0, 3).map((a) => (
              <AnnouncementCard key={a._id} announcement={a} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Continue Learning ────────────────────────── */}
      {continueCourse ? (
        <Card className="mb-8 overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
            <div className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                Continue Learning
              </p>
              <h2 className="mt-3 text-2xl font-bold text-text-primary md:text-3xl">
                {continueCourse.title}
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Current lesson set · {continueCourse.completedLessons} of{' '}
                {continueCourse.totalLessons} complete
              </p>

              <div className="mt-5 h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-tertiary">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${continueCourse.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-text-muted">
                {continueCourse.percentage}% complete
              </p>

              <div className="mt-6">
                <Link
                  to={`/courses/${continueCourse.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <Play size={16} /> Resume Learning
                </Link>
              </div>
            </div>

            <div className="hidden items-center justify-center bg-gradient-to-br from-brand-700/20 to-transparent p-10 lg:flex">
              <Sparkles size={64} className="text-brand-500/40" />
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-8 p-10 text-center">
          <Sparkles size={40} className="mx-auto text-brand-500/60" />
          <h2 className="mt-4 text-xl font-bold text-text-primary">
            Start your first roadmap
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Pick a path and KodxCamp will guide you through it.
          </p>
          <Link
            to="/roadmaps"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <MapIcon size={16} /> Explore roadmaps
          </Link>
        </Card>
      )}

      {/* ─── My Roadmaps ─────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            My Roadmaps
          </h2>
          <Link
            to="/roadmaps"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
          >
            All roadmaps <ArrowRight size={12} />
          </Link>
        </div>

        {myRoadmaps.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-muted">
            You're not enrolled in any roadmaps yet.{' '}
            <Link to="/roadmaps" className="text-brand-500 hover:underline">
              Browse roadmaps →
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myRoadmaps.slice(0, 3).map((r) => (
              <Link
                key={r._id}
                to={`/roadmaps/${r.slug}/overview`}
                className="group block"
              >
                <Card className="flex h-full flex-col p-5 transition-all hover:border-brand-500/60">
                  <div className="flex items-center gap-2">
                    <MapIcon size={14} className="text-brand-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      Roadmap
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-text-primary">
                    {r.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-muted">
                    {r.tagline ?? r.description}
                  </p>
                  <p className="mt-3 text-xs text-text-muted">
                    {r.courseCount}{' '}
                    {r.courseCount === 1 ? 'course' : 'courses'}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── My Courses ──────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            My Courses
          </h2>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
          >
            All courses <ArrowRight size={12} />
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-muted">
            You haven't started any courses yet.{' '}
            <Link to="/courses" className="text-brand-500 hover:underline">
              Browse courses →
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <Link
                key={c.courseId}
                to={`/courses/${c.slug}`}
                className="group block"
              >
                <Card className="flex h-full flex-col p-5 transition-all hover:border-brand-500/60">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-brand-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      Course
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-text-primary">
                    {c.title}
                  </h3>
                  <div className="mt-auto pt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      {c.completedLessons} / {c.totalLessons} lessons ·{' '}
                      {c.percentage}%
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── Recent Activity ─────────────────────────── */}
      {activity.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Recent Activity
          </h2>
          <Card className="divide-y divide-border p-0">
            {activity.slice(0, 8).map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
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
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {a.xp > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-brand-500">
                    +{a.xp} XP
                  </span>
                )}
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
};