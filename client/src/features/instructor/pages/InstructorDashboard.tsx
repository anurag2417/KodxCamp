import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Plus,
  Video,
  FileText,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  instructorApi,
  type ApiCohortSummary,
  type ApiInstructorCourse,
  type InstructorSubmissionSummary,
} from '@/features/instructor/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/shared/store/auth.store';

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

/**
 * Instructor dashboard.
 *
 * Master Spec, section 71:
 *   "The Instructor dashboard should be simpler than Admin.
 *    It should answer: What do I need to do today?"
 *
 * Three things lead: what's pending (reviews waiting), who I teach
 * (cohorts), what I own (courses). Quick actions follow.
 */
export const InstructorDashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [cohorts, setCohorts] = useState<ApiCohortSummary[]>([]);
  const [courses, setCourses] = useState<ApiInstructorCourse[]>([]);
  const [pendingReviews, setPendingReviews] = useState<
    InstructorSubmissionSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, cs, pending] = await Promise.all([
        instructorApi.listMyCohorts(),
        instructorApi.listMyCourses(),
        instructorApi.listPendingReviews(),
      ]);
      setCohorts(c);
      setCourses(cs);
      setPendingReviews(pending);
    } catch {
      setError('Failed to load your dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-text-primary">
          Instructor Overview
        </h1>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load your dashboard"
            message={error}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  const totalStudents = cohorts.reduce((sum, c) => sum + c.studentCount, 0);
  const activeCohorts = cohorts.filter((c) => !c.archived);

  return (
    <div className="w-full p-6 lg:p-8">
      {/* Hero */}
      <div className="mb-8">
        <p className="text-sm text-text-muted">{greetingForNow()} 👋</p>
        <h1 className="mt-1 text-3xl font-bold text-text-primary md:text-4xl">
          {user?.name ? user.name.split(' ')[0] : 'Instructor'}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Here's what's happening across your cohorts today.
        </p>
      </div>

      {/* Pending reviews — the to-do list */}
      {pendingReviews.length > 0 && (
        <Card className="mb-8 border-brand-500/30 bg-brand-500/5 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-brand-500" />
              <h2 className="text-lg font-semibold text-text-primary">
                {pendingReviews.length}{' '}
                {pendingReviews.length === 1
                  ? 'submission needs review'
                  : 'submissions need review'}
              </h2>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {pendingReviews.slice(0, 5).map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {s.student.avatar ? (
                    <img
                      src={s.student.avatar}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-tertiary text-[10px] font-bold text-text-secondary">
                      {s.student.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {s.student.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      Attempt #{s.attemptNumber}
                      {s.testRun &&
                        ` · ${s.testRun.passedTests}/${s.testRun.totalTests} tests`}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/instructor/submissions/${s._id}`}
                  className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
          {pendingReviews.length > 5 && (
            <p className="mt-3 text-xs text-text-muted">
              + {pendingReviews.length - 5} more waiting. Open a project to see
              the full queue.
            </p>
          )}
        </Card>
      )}

      {/* Stat row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <GraduationCap size={14} className="text-brand-500" />
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Active Cohorts
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-500">
            {activeCohorts.length}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-brand-500" />
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Students
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-500">
            {totalStudents}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-brand-500" />
            <p className="text-xs uppercase tracking-wider text-text-muted">
              My Courses
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-500">
            {courses.length}
          </p>
        </Card>
      </div>

      {/* My Cohorts */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            My Cohorts
          </h2>
          <Link
            to="/instructor/cohorts"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
          >
            Manage all <ArrowRight size={12} />
          </Link>
        </div>

        {activeCohorts.length === 0 ? (
          <Card className="p-8 text-center text-sm text-text-muted">
            You're not teaching any cohorts yet.{' '}
            <Link
              to="/instructor/cohorts"
              className="text-brand-500 hover:underline"
            >
              Create one →
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCohorts.slice(0, 6).map((c) => (
              <Link
                key={c._id}
                to={`/instructor/cohorts/${c._id}`}
                className="group block"
              >
                <Card className="flex h-full flex-col p-5 transition-all hover:border-brand-500/60">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                    {c.entityKind === 'course'
                      ? 'Course cohort'
                      : 'Roadmap cohort'}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-text-primary">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">
                    {c.entityTitle}
                    {c.startDate && ` · ${c.startDate}`}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} />
                      {c.studentCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap size={11} />
                      {c.instructorCount}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My Courses */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            My Courses
          </h2>
          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
          >
            Manage all <ArrowRight size={12} />
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card className="p-8 text-center text-sm text-text-muted">
            No courses yet.{' '}
            <Link
              to="/instructor/courses/new"
              className="text-brand-500 hover:underline"
            >
              Create one →
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <Card
                key={c._id}
                className="flex h-full flex-col p-5 transition-all hover:border-brand-500/60"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {c.language}
                </span>
                <Link
                  to={`/instructor/courses/${c.slug}`}
                  className="mt-2 block"
                >
                  <h3 className="text-base font-semibold text-text-primary hover:text-brand-500">
                    {c.title}
                  </h3>
                </Link>
                <p className="mt-1 text-xs text-text-muted">
                  {c.totalLessons}{' '}
                  {c.totalLessons === 1 ? 'lesson' : 'lessons'}
                  {!c.published && (
                    <>
                      {' · '}
                      <span className="text-[var(--color-warning)]">
                        Draft
                      </span>
                    </>
                  )}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Link
                    to={`/instructor/projects/${c.slug}/submissions`}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-brand-500/40 hover:text-brand-500"
                  >
                    <FileText size={11} />
                    Submissions
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/instructor/courses/new">
            <Card className="flex items-center gap-3 p-5 transition-all hover:border-brand-500/60">
              <Plus size={20} className="text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  New Course
                </p>
                <p className="text-xs text-text-muted">
                  Start from scratch
                </p>
              </div>
            </Card>
          </Link>
          <Link to="/instructor/cohorts">
            <Card className="flex items-center gap-3 p-5 transition-all hover:border-brand-500/60">
              <GraduationCap size={20} className="text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  New Cohort
                </p>
                <p className="text-xs text-text-muted">
                  Group your students
                </p>
              </div>
            </Card>
          </Link>
          <Link to="/admin/classes">
            <Card className="flex items-center gap-3 p-5 transition-all hover:border-brand-500/60">
              <Video size={20} className="text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Schedule a Class
                </p>
                <p className="text-xs text-text-muted">
                  Live session for students
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
};