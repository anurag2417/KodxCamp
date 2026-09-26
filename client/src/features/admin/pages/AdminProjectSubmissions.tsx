import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import {
  adminApi,
  type AdminSubmissionSummary,
  type AdminAIStatus,
} from '@/features/admin/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { AdminTable } from '@/features/admin/components/AdminTable';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

/**
 * Submission list for a single project.
 *
 * Rows show enough to triage at a glance: who submitted, which
 * attempt, how the automated tests went, and the latest AI scores
 * for each pass. The "Evaluate" button runs the pipeline for that
 * row; a second click is idempotent (the server rejects a duplicate
 * run under the same evaluator + prompt versions, and the toast
 * surfaces the reason).
 */
export const AdminProjectSubmissions: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const toast = useToast();

  const [submissions, setSubmissions] = useState<AdminSubmissionSummary[]>([]);
  const [aiStatus, setAiStatus] = useState<AdminAIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [rows, status] = await Promise.all([
        adminApi.listProjectSubmissions(slug),
        adminApi.getAIStatus(),
      ]);
      setSubmissions(rows);
      setAiStatus(status);
    } catch {
      toast.error('Could not load submissions');
    } finally {
      setLoading(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleEvaluate = async (submissionId: string) => {
    setEvaluatingId(submissionId);
    try {
      const result = await adminApi.evaluateSubmission(submissionId);
      const count = result.evaluations?.length ?? 0;
      toast.success(
        count === 1
          ? 'Evaluation complete (1 pass)'
          : `Evaluation complete (${count} passes)`
      );
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      // Duplicate-key errors are the "already evaluated under these
      // versions" case. Message is already clear from the server.
      toast.error(msg);
    } finally {
      setEvaluatingId(null);
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/admin/projects"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> All projects
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

      {aiStatus && !aiStatus.textConfigured && (
        <Card className="mb-6 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 text-sm text-[var(--color-warning)]">
          <p className="font-medium">AI evaluation is not configured</p>
          <p className="mt-1 text-xs opacity-90">
            Set <code>GROQ_API_KEY</code> and{' '}
            <code>AI_TEXT_PROVIDER=groq</code> in the server environment.
            {aiStatus.visionConfigured
              ? ''
              : ' Vision evaluation is also disabled — set AI_VISION_PROVIDER=groq to enable screenshot review.'}
          </p>
        </Card>
      )}

      {submissions.length === 0 && (
        <Card className="p-8 text-center text-sm text-text-muted">
          No submissions for this project yet.
        </Card>
      )}

      {submissions.length > 0 && (
        <AdminTable
          headers={[
            'Student',
            'Attempt',
            'Tests',
            'Screenshots',
            'AI (code)',
            'AI (vision)',
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
                {s.testRunSummary ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium',
                      s.testRunSummary.allPassed
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-warning)]'
                    )}
                  >
                    {s.testRunSummary.allPassed ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {s.testRunSummary.passedTests}/
                    {s.testRunSummary.totalTests}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {s.hasScreenshots ? (
                  <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                    <ImageIcon size={12} /> yes
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <ScoreCell
                  score={s.latestEvaluations.code?.score ?? null}
                  hasEval={Boolean(s.latestEvaluations.code)}
                />
              </td>
              <td className="px-4 py-3">
                <ScoreCell
                  score={s.latestEvaluations.vision?.score ?? null}
                  hasEval={Boolean(s.latestEvaluations.vision)}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEvaluate(s._id)}
                    disabled={
                      evaluatingId === s._id || !aiStatus?.textConfigured
                    }
                    title={
                      !aiStatus?.textConfigured
                        ? 'AI evaluation is not configured'
                        : 'Run AI evaluation'
                    }
                  >
                    <Sparkles size={12} />
                    {evaluatingId === s._id ? 'Running…' : 'Evaluate'}
                  </Button>
                  <Link
                    to={`/admin/projects/submissions/${s._id}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-500 transition-colors hover:bg-brand-500/10"
                  >
                    View <ChevronRight size={12} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

const ScoreCell: React.FC<{ score: number | null; hasEval: boolean }> = ({
  score,
  hasEval,
}) => {
  if (!hasEval) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
        <Clock size={11} /> not run
      </span>
    );
  }
  if (score === null) {
    return <span className="text-xs text-text-muted">—</span>;
  }
  return (
    <span
      className={cn(
        'text-sm font-semibold',
        score >= 70
          ? 'text-[var(--color-success)]'
          : score >= 40
            ? 'text-[var(--color-warning)]'
            : 'text-[var(--color-error)]'
      )}
    >
      {score}
    </span>
  );
};