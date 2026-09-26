import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  instructorApi,
  type InstructorSubmissionSummary,
  type InstructorReviewStatus,
} from '@/features/instructor/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { AdminTable } from '@/features/admin/components/AdminTable';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

type Filter = 'needs_review' | 'reviewed' | 'all';

/**
 * Project submissions as seen by an instructor.
 *
 * Same information density as the admin's submission list, but
 * focused on the review workflow: which submissions still need a
 * human's eyes, and which already have one. The filter defaults to
 * `needs_review` because that's the instructor's actual to-do list —
 * a submission that's been reviewed doesn't need attention.
 */
export const InstructorProjectSubmissions: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const toast = useToast();

  const [filter, setFilter] = useState<Filter>('needs_review');
  const [submissions, setSubmissions] = useState<InstructorSubmissionSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const rows = await instructorApi.listProjectSubmissions(slug, filter);
      setSubmissions(rows);
    } catch {
      toast.error('Could not load submissions');
    } finally {
      setLoading(false);
    }
  }, [slug, filter, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading && submissions.length === 0) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const FILTERS: { value: Filter; label: string }[] = [
    { value: 'needs_review', label: 'Needs review' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/instructor"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Submissions
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {submissions.length}{' '}
            {submissions.length === 1 ? 'submission' : 'submissions'} for{' '}
            <span className="font-mono">{slug}</span>
          </p>
        </div>
        <Button variant="secondary" onClick={reload} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-brand-500 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {submissions.length === 0 && (
        <Card className="p-8 text-center text-sm text-text-muted">
          {filter === 'needs_review'
            ? 'Nothing to review — every submission has been reviewed.'
            : filter === 'reviewed'
              ? 'No submissions have been reviewed yet.'
              : 'No submissions for this project yet.'}
        </Card>
      )}

      {submissions.length > 0 && (
        <AdminTable
          headers={[
            'Student',
            'Attempt',
            'Tests',
            'Review',
            'Actions',
          ]}
        >
          {submissions.map((s) => (
            <tr
              key={s._id}
              className="transition-colors hover:bg-surface-secondary"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
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
                      {s.student.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-500/10 font-mono text-xs font-bold text-brand-500">
                  #{s.attemptNumber}
                </span>
              </td>
              <td className="px-4 py-3">
                {s.testRun ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium',
                      s.testRun.allPassed
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-warning)]',
                    )}
                  >
                    {s.testRun.allPassed ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {s.testRun.passedTests}/{s.testRun.totalTests}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {s.latestReview ? (
                  <div className="flex flex-col gap-0.5">
                    <StatusBadge status={s.latestReview.status} />
                    <span className="text-[10px] text-text-muted">
                      score {s.latestReview.finalScore} · rev{' '}
                      {s.latestReview.revisionNumber}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    <Clock size={11} /> pending
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/instructor/submissions/${s._id}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-500 transition-colors hover:bg-brand-500/10"
                >
                  <FileText size={12} />
                  Review
                  <ChevronRight size={12} />
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

const STATUS_LABELS: Record<
  InstructorReviewStatus,
  { label: string; tone: string }
> = {
  passed: {
    label: 'Passed',
    tone: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  },
  needs_improvement: {
    label: 'Needs work',
    tone: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  },
  resubmission_requested: {
    label: 'Resubmit',
    tone: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  },
};

const StatusBadge: React.FC<{ status: InstructorReviewStatus }> = ({
  status,
}) => {
  const meta = STATUS_LABELS[status] ?? STATUS_LABELS.passed;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
        meta.tone,
      )}
    >
      {meta.label}
    </span>
  );
};