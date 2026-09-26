import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  adminApi,
  type AdminAIEvaluation,
  type AdminAIStatus,
  type AdminSubmissionDetail,
} from '@/features/admin/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

/**
 * Single-submission admin view.
 *
 * Three sections:
 *   1. The submission — student, attempt, notes, files, test run,
 *      screenshots.
 *   2. The AI evaluations — every row ever produced for this
 *      submission, newest first, one card per (kind, version).
 *   3. A raw-response debug viewer per evaluation, collapsed by
 *      default.
 *
 * The "Evaluate" button is the same one from the list view; running
 * it here is convenient when the admin is already inspecting the
 * submission and wants a fresh pass.
 */
export const AdminSubmissionEvaluation: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const toast = useToast();

  const [submission, setSubmission] = useState<AdminSubmissionDetail | null>(
    null,
  );
  const [evaluations, setEvaluations] = useState<AdminAIEvaluation[]>([]);
  const [aiStatus, setAiStatus] = useState<AdminAIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const reload = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      const [sub, evals, status] = await Promise.all([
        adminApi.getAdminSubmission(submissionId),
        adminApi.listEvaluations(submissionId),
        adminApi.getAIStatus(),
      ]);
      setSubmission(sub);
      setEvaluations(evals);
      setAiStatus(status);
    } catch {
      toast.error('Could not load submission');
    } finally {
      setLoading(false);
    }
  }, [submissionId, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleEvaluate = async () => {
    if (!submissionId) return;
    setEvaluating(true);
    try {
      const result = await adminApi.evaluateSubmission(submissionId);
      const count = result.evaluations?.length ?? 0;
      toast.success(
        count === 1
          ? 'Evaluation complete (1 pass)'
          : `Evaluation complete (${count} passes)`,
      );
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading && !submission) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="w-full p-6 lg:p-8">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={14} /> All projects
        </Link>
        <p className="mt-6 text-sm text-[var(--color-error)]">
          Submission not found.
        </p>
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

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Submission #{submission.attemptNumber}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {submission.student.name} · {submission.student.email}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            <Clock size={11} className="mr-1 inline" />
            {formatDate(submission.submittedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reload} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            onClick={handleEvaluate}
            disabled={evaluating || !aiStatus?.textConfigured}
            title={
              !aiStatus?.textConfigured
                ? 'AI evaluation is not configured'
                : 'Run a fresh evaluation pass'
            }
          >
            <Sparkles size={14} />
            {evaluating ? 'Running…' : 'Evaluate'}
          </Button>
        </div>
      </div>

      {/* AI not configured banner */}
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

      {/* Submission */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-text-secondary">
          Submission
        </h2>

        {submission.notes && (
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Student notes
            </p>
            <p className="whitespace-pre-line rounded-md bg-surface-secondary p-3 text-xs text-text-secondary">
              {submission.notes}
            </p>
          </div>
        )}

        {submission.testRun ? (
          <TestRunView testRun={submission.testRun} />
        ) : (
          <p className="text-xs text-text-muted">
            No automated tests were recorded for this submission.
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowFiles((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
        >
          {showFiles ? <EyeOff size={12} /> : <Eye size={12} />}
          {showFiles
            ? 'Hide submitted files'
            : `View submitted files (${submission.files.length})`}
        </button>

        {showFiles && (
          <div className="mt-3 flex flex-col gap-2">
            {submission.files.map((f) => (
              <div
                key={f.name}
                className="rounded-md border border-border bg-surface-secondary p-3"
              >
                <p className="mb-2 font-mono text-[10px] font-semibold text-text-secondary">
                  {f.name}
                </p>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-text-primary">
                  {f.content || '(empty)'}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Screenshots */}
      {submission.screenshots && (
        <ScreenshotsView screenshots={submission.screenshots} />
      )}

      {/* Evaluations */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            AI Evaluations
          </h2>
          <span className="text-xs text-text-muted">
            {evaluations.length}{' '}
            {evaluations.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        {evaluations.length === 0 && (
          <Card className="p-6 text-center text-sm text-text-muted">
            No AI evaluations yet. Click <strong>Evaluate</strong> to run the
            pipeline.
          </Card>
        )}

        {evaluations.length > 0 && (
          <div className="flex flex-col gap-4">
            {evaluations.map((ev) => (
              <EvaluationCard key={ev._id} evaluation={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────────────── */

type TestRun = NonNullable<AdminSubmissionDetail['testRun']>;

const TestRunView: React.FC<{ testRun: TestRun }> = ({ testRun }) => {
  if (testRun.error) {
    return (
      <div className="rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-3 text-xs text-[var(--color-warning)]">
        <p className="font-medium">Test run did not complete</p>
        <p className="mt-1 opacity-90">{testRun.error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span
          className={cn(
            'font-semibold',
            testRun.allPassed
              ? 'text-[var(--color-success)]'
              : 'text-[var(--color-warning)]',
          )}
        >
          {testRun.passedTests} / {testRun.totalTests} tests passed
        </span>
        <span className="text-text-muted">({testRun.durationMs}ms)</span>
      </div>
      {testRun.results && testRun.results.length > 0 && (
        <div className="flex flex-col gap-1">
          {testRun.results.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 rounded-md px-2 py-1.5 text-xs',
                r.passed
                  ? 'bg-[var(--color-success)]/5 text-[var(--color-success)]'
                  : 'bg-[var(--color-error)]/5 text-[var(--color-error)]',
              )}
            >
              {r.passed ? (
                <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
              ) : (
                <XCircle size={12} className="mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-medium">{r.name}</span>
                {r.message && (
                  <p className="mt-0.5 text-[10px] opacity-80">
                    {r.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

type ScreenshotSet = NonNullable<AdminSubmissionDetail['screenshots']>;

const ScreenshotsView: React.FC<{ screenshots: ScreenshotSet }> = ({
  screenshots,
}) => {
  const hasAny = screenshots.desktop || screenshots.mobile;
  if (!hasAny && !screenshots.error) return null;

  return (
    <Card className="mb-6 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-text-secondary">
        Screenshots
      </h2>
      {screenshots.error && (
        <p className="mb-3 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 px-3 py-2 text-xs text-[var(--color-warning)]">
          {screenshots.error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {screenshots.desktop && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Desktop ({screenshots.desktop.width}×
              {screenshots.desktop.height})
            </p>
            <img
              src={screenshots.desktop.dataUrl}
              alt="Desktop screenshot"
              className="w-full rounded-md border border-border"
            />
          </div>
        )}
        {screenshots.mobile && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Mobile ({screenshots.mobile.width}×{screenshots.mobile.height})
            </p>
            <img
              src={screenshots.mobile.dataUrl}
              alt="Mobile screenshot"
              className="max-w-[240px] rounded-md border border-border"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

const EvaluationCard: React.FC<{ evaluation: AdminAIEvaluation }> = ({
  evaluation,
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const [showCategories, setShowCategories] = useState(true);
  const [showRequirements, setShowRequirements] = useState(true);

  const parsed = evaluation.parsed;
  const hasParseError = Boolean(evaluation.parseError);
  const isNullProvider = parsed?.evaluatorNotConfigured === true;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              evaluation.kind === 'vision'
                ? 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
                : 'bg-brand-500/10 text-brand-500',
            )}
          >
            {evaluation.kind}
          </span>
          <span className="text-xs text-text-muted">
            {formatDate(evaluation.evaluationDate)}
          </span>
          {evaluation.usedImages && (
            <span className="text-[10px] text-text-muted">· saw images</span>
          )}
        </div>
        {parsed?.score != null && (
          <span
            className={cn(
              'text-2xl font-bold',
              parsed.score >= 70
                ? 'text-[var(--color-success)]'
                : parsed.score >= 40
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-error)]',
            )}
          >
            {parsed.score}
            <span className="text-sm font-normal text-text-muted">/100</span>
          </span>
        )}
      </div>

      {/* Provenance */}
      <div className="mb-4 flex flex-wrap gap-3 text-[10px] text-text-muted">
        <span>
          provider: <code>{evaluation.provider}</code>
        </span>
        <span>
          model: <code>{evaluation.modelId}</code>
        </span>
        <span>
          prompt: <code>{evaluation.promptVersion}</code>
        </span>
        <span>
          evaluator: <code>{evaluation.evaluatorVersion}</code>
        </span>
      </div>

      {/* Parse error / not-configured notice */}
      {hasParseError && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-3 text-xs text-[var(--color-error)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              The model's response could not be parsed
            </p>
            <p className="mt-1 opacity-90">{evaluation.parseError}</p>
          </div>
        </div>
      )}

      {isNullProvider && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-3 text-xs text-[var(--color-warning)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">AI evaluation was not configured</p>
            <p className="mt-1 opacity-90">{parsed?.overallFeedback}</p>
          </div>
        </div>
      )}

      {/* Overall feedback */}
      {parsed?.overallFeedback && !isNullProvider && (
        <div className="mb-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Overall feedback
          </p>
          <p className="whitespace-pre-line rounded-md bg-surface-secondary p-3 text-sm text-text-secondary">
            {parsed.overallFeedback}
          </p>
        </div>
      )}

      {/* Category scores */}
      {parsed?.categoryScores && parsed.categoryScores.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCategories((v) => !v)}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
          >
            {showCategories ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            Category scores ({parsed.categoryScores.length})
          </button>
          {showCategories && (
            <div className="overflow-hidden rounded-md border border-border">
              {parsed.categoryScores.map((c, i) => (
                <div
                  key={i}
                  className="border-b border-border bg-surface p-3 last:border-b-0"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {c.category}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      {c.score}
                      <span className="text-xs font-normal text-text-muted">
                        /{c.max}
                      </span>
                    </span>
                  </div>
                  {c.notes && (
                    <p className="mt-1 text-xs text-text-secondary">
                      {c.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requirement results */}
      {parsed?.requirementResults && parsed.requirementResults.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowRequirements((v) => !v)}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
          >
            {showRequirements ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            Requirements (
            {parsed.requirementResults.filter((r) => r.met).length}/
            {parsed.requirementResults.length} met)
          </button>
          {showRequirements && (
            <div className="flex flex-col gap-1">
              {parsed.requirementResults.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-3 py-2 text-xs',
                    r.met
                      ? 'bg-[var(--color-success)]/5 text-[var(--color-success)]'
                      : 'bg-[var(--color-error)]/5 text-[var(--color-error)]',
                  )}
                >
                  {r.met ? (
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={12} className="mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.requirement}</p>
                    {r.evidence && (
                      <p className="mt-0.5 text-[10px] opacity-80">
                        {r.evidence}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raw response */}
      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
      >
        {showRaw ? <EyeOff size={12} /> : <Eye size={12} />}
        {showRaw ? 'Hide raw response' : 'Show raw response'}
      </button>
      {showRaw && (
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-surface-secondary p-3 font-mono text-[10px] text-text-secondary">
          {evaluation.rawResponse}
        </pre>
      )}
    </Card>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}