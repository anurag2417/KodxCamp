import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Flame,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import {
  instructorApi,
  type ApiStudentDetail,
} from '@/features/instructor/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Card } from '@/shared/components/ui/Card';
import { ProgressRing } from '@/features/progress/components/ProgressRing';
import { cn } from '@/shared/lib/utils';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

export const InstructorStudentDetail: React.FC = () => {
  const { slug, userId } = useParams<{ slug: string; userId: string }>();
  const [data, setData] = useState<ApiStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    instructorApi
      .getStudent(slug, userId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load this student.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, userId]);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full p-6 lg:p-8">
        <Link
          to={`/instructor/students?course=${slug}`}
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={14} /> Back to Students
        </Link>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load this student"
            message={error ?? 'Student not found.'}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const { student, progress, submissions, submissionsByDifficulty, recentActivity } = data;

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to={`/instructor/students?course=${slug}`}
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Back to Students
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-6">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-500 text-xl font-bold text-white">
              {initials(student.name) || '?'}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-text-primary">
              {student.name || '(no name)'}
            </h1>
            <p className="mt-1 text-sm text-text-muted">{student.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1">
                <TrendingUp size={12} /> Level from {student.xp} XP
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame size={12} /> {student.streak}-day streak
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> Last active{' '}
                {relativeTime(student.lastActiveAt)}
              </span>
              {data.enrollment && (
                <span className="inline-flex items-center gap-1">
                  <BookOpen size={12} /> Joined{' '}
                  {new Date(data.enrollment.joinedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <ProgressRing value={progress.percentage} size={96} />
          </div>
        </div>
      </Card>

      {/* Stat row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Lessons completed
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {progress.completedLessons} / {progress.totalLessons}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Problems solved
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {submissionsByDifficulty.easy +
              submissionsByDifficulty.medium +
              submissionsByDifficulty.hard}
          </p>
          <p className="mt-1 text-[10px] text-text-muted">
            {submissionsByDifficulty.easy}E · {submissionsByDifficulty.medium}M
            · {submissionsByDifficulty.hard}H
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Submissions
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {submissions.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Recent activities
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {recentActivity.length}
          </p>
        </Card>
      </div>

      {/* Two-column: lesson progress + recent activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Lesson progress
          </h2>
          <div className="flex flex-col gap-2">
            {progress.lessons.map((l) => (
              <div
                key={l._id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  {l.completed ? (
                    <CheckCircle2
                      size={14}
                      className="shrink-0 text-[var(--color-success)]"
                    />
                  ) : (
                    <XCircle
                      size={14}
                      className="shrink-0 text-text-muted"
                    />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      l.completed
                        ? 'text-text-primary'
                        : 'text-text-muted'
                    )}
                  >
                    {l.title}
                  </span>
                </div>
                <span className="text-xs text-text-muted">#{l.order}</span>
              </div>
            ))}
            {progress.lessons.length === 0 && (
              <p className="text-xs text-text-muted">No lessons yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Recent activity
          </h2>
          <div className="flex flex-col gap-2">
            {recentActivity.map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Award size={12} className="text-brand-500" />
                  <span className="text-text-primary">{a.type}</span>
                </div>
                <span className="text-text-muted">
                  {relativeTime(a.createdAt)}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-xs text-text-muted">No activity recorded.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Submissions table */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Submissions
        </h2>
        {submissions.length === 0 ? (
          <p className="text-xs text-text-muted">No submissions yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {submissions.map((s) => {
              const ok = s.status === 'accepted';
              return (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {ok ? (
                      <CheckCircle2
                        size={14}
                        className="shrink-0 text-[var(--color-success)]"
                      />
                    ) : (
                      <XCircle
                        size={14}
                        className="shrink-0 text-[var(--color-error)]"
                      />
                    )}
                    <Link
                      to={`/practice/${s.problemSlug}`}
                      className="truncate font-medium text-text-primary hover:text-brand-500"
                    >
                      {s.problemTitle}
                    </Link>
                    <span className="text-text-muted">
                      · {s.language} · {s.passedTests}/{s.totalTests}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-text-muted">
                    {s.runtimeMs != null && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {s.runtimeMs}ms
                      </span>
                    )}
                    <span>{relativeTime(s.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};