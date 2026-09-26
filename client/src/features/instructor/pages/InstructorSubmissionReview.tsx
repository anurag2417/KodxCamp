import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  History,
  User as UserIcon,
} from 'lucide-react';
import {
  instructorApi,
  type InstructorSubmissionDetail,
  type InstructorEvaluation,
  type InstructorReviewStatus,
  type InstructorCategoryOverride,
} from '@/features/instructor/api';
import type { AIEvaluationShape } from '@/features/projects/components/AIEvaluationCard';
import { AIEvaluationCard } from '@/features/projects/components/AIEvaluationCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

/**
 * Instructor submission review page.
 *
 * Two columns:
 *
 *   Left  — the evidence. Student files, automated test run,
 *           screenshots, every AI evaluation. Scrolls.
 *
 *   Right — the scoring form. Score, category overrides, feedback,
 *           resubmission checkbox. Sticky on wide screens; drops
 *           below the evidence on narrow ones.
 *
 * The form prefills its score from the latest AI code-pass score
 * (or the average of code and vision when both are present). The
 * instructor can override freely. The AI evaluation is never
 * mutated by saving a review.
 *
 * Every save creates a NEW revision. The instructor's own past
 * reviews are visible above the form so they can see what they said
 * last time.
 */
export const InstructorSubmissionReview: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const toast = useToast();

  const [submission, setSubmission] = useState<InstructorSubmissionDetail | null>(
    null,
  );
  const [reviews, setReviews] = useState<InstructorEvaluation[]>([]);
  const [aiEvaluations, setAiEvaluations] = useState<AIEvaluationShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFiles, setShowFiles] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [finalScore, setFinalScore] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [requestResubmission, setRequestResubmission] = useState(false);
  const [status, setStatus] = useState<InstructorReviewStatus>('passed');
  const [categoryOverrides, setCategoryOverrides] = useState<
    InstructorCategoryOverride[]
  >([]);
  const [initialized, setInitialized] = useState(false);

  const reload = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      const [sub, revs] = await Promise.all([
        instructorApi.getSubmission(submissionId),
        instructorApi.listReviews(submissionId),
      ]);
      setSubmission(sub);
      setReviews(revs);

      // Load AI evaluations from the admin route — instructors can
      // read them via the shared `adminApi.listEvaluations`. Using
      // the admin route directly keeps the read path one call.
      //
      // Alternatively, this could be exposed on the instructor
      // routes; either is fine, and the admin route is already
      // guarded by role.
      const { adminApi } = await import('@/features/admin/api');
      const evals = await adminApi.listEvaluations(submissionId);
      setAiEvaluations(evals as AIEvaluationShape[]);
    } catch {
      toast.error('Could not load submission');
    } finally {
      setLoading(false);
    }
  }, [submissionId, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Prefill the score from the AI once, on first load. Not on every
  // reload — the instructor may have started typing.
  useEffect(() => {
    if (initialized) return;
    if (!submission || aiEvaluations.length === 0) return;

    const codeEval = aiEvaluations.find((e) => e.kind === 'code');
    const visionEval = aiEvaluations.find((e) => e.kind === 'vision');
    const codeScore = codeEval?.parsed?.score ?? null;
    const visionScore = visionEval?.parsed?.score ?? null;

    let prefill = 0;
    if (codeScore != null && visionScore != null) {
      prefill = Math.round((codeScore + visionScore) / 2);
    } else if (codeScore != null) {
      prefill = codeScore;
    } else if (visionScore != null) {
      prefill = visionScore;
    }
    setFinalScore(prefill);
    setInitialized(true);
  }, [submission, aiEvaluations, initialized]);

  const aiRubricCategories = useMemo(() => {
    const codeEval = aiEvaluations.find((e) => e.kind === 'code');
    return codeEval?.parsed?.categoryScores ?? [];
  }, [aiEvaluations]);

  const handleOverrideChange = (
    category: string,
    score: number,
    max: number,
  ) => {
    // Clamp to the category's max.
    const clamped = Math.max(0, Math.min(score, max));
    setCategoryOverrides((prev) => {
      const existing = prev.find((o) => o.category === category);
      if (existing) {
        return prev.map((o) =>
          o.category === category ? { ...o, score: clamped } : o,
        );
      }
      return [...prev, { category, score: clamped }];
    });
  };

  const handleSave = async () => {
    if (!submissionId) return;
    if (!feedback.trim()) {
      toast.error('Feedback is required');
      return;
    }
    if (requestResubmission && status !== 'resubmission_requested') {
      setStatus('resubmission_requested');
    }
    setSaving(true);
    try {
      await instructorApi.createReview(submissionId, {
        finalScore,
        categoryOverrides,
        feedback: feedback.trim(),
        requestResubmission,
        status: requestResubmission ? 'resubmission_requested' : status,
      });
      toast.success('Review saved');
      setFeedback('');
      setCategoryOverrides([]);
      setRequestResubmission(false);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save review');
    } finally {
      setSaving(false);
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
          to="/instructor"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={14} /> Dashboard
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
        to="/instructor"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">
          Review attempt #{submission.attemptNumber}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {submission.student.name} · {submission.student.email}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          <Clock size={11} className="mr-1 inline" />
          Submitted {formatDate(submission.submittedAt)}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,420px)]">
        {/* Left: evidence */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Student notes */}
          {submission.notes && (
            <Card className="p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
                Student notes
              </h2>
              <p className="whitespace-pre-line text-sm text-text-secondary">
                {submission.notes}
              </p>
            </Card>
          )}

          {/* Test run */}
          <Card className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
              Automated tests
            </h2>
            {submission.testRun ? (
              <TestRunView testRun={submission.testRun} />
            ) : (
              <p className="text-xs text-text-muted">
                No automated tests were recorded for this submission.
              </p>
            )}
          </Card>

          {/* Screenshots */}
          {submission.screenshots &&
            (submission.screenshots.desktop ||
              submission.screenshots.mobile) && (
              <Card className="p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-text-secondary">
                  Screenshots
                </h2>
                {submission.screenshots.error && (
                  <p className="mb-3 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 px-3 py-2 text-xs text-[var(--color-warning)]">
                    {submission.screenshots.error}
                  </p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {submission.screenshots.desktop && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                        Desktop ({submission.screenshots.desktop.width}×
                        {submission.screenshots.desktop.height})
                      </p>
                      <img
                        src={submission.screenshots.desktop.dataUrl}
                        alt="Desktop screenshot"
                        className="w-full rounded-md border border-border"
                      />
                    </div>
                  )}
                  {submission.screenshots.mobile && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                        Mobile ({submission.screenshots.mobile.width}×
                        {submission.screenshots.mobile.height})
                      </p>
                      <img
                        src={submission.screenshots.mobile.dataUrl}
                        alt="Mobile screenshot"
                        className="max-w-[240px] rounded-md border border-border"
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}

          {/* Submitted files */}
          <Card className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
                Submitted files
              </h2>
              <button
                type="button"
                onClick={() => setShowFiles((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
              >
                {showFiles ? <EyeOff size={12} /> : <Eye size={12} />}
                {showFiles ? 'Hide' : 'Show'}
              </button>
            </div>
            {showFiles && (
              <div className="flex flex-col gap-2">
                {submission.files.map((f) => (
                  <div
                    key={f.name}
                    className="rounded-md border border-border bg-surface-secondary p-3"
                  >
                    <p className="mb-2 font-mono text-[10px] font-semibold text-text-secondary">
                      {f.name}
                    </p>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-text-primary">
                      {f.content || '(empty)'}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* AI evaluations */}
          {aiEvaluations.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
                AI evaluations ({aiEvaluations.length})
              </h2>
              <div className="flex flex-col gap-4">
                {aiEvaluations.map((ev) => (
                  <AIEvaluationCard key={ev._id} evaluation={ev} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: form */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-text-secondary">
              Your review
            </h2>

            {/* Score */}
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              Final score (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={finalScore}
              onChange={(e) => setFinalScore(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-2xl font-bold text-text-primary focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-text-muted">
              Prefilled from the AI evaluation. Override freely — the AI
              score is stored separately and never changes.
            </p>

            {/* Category overrides */}
            {aiRubricCategories.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-text-secondary">
                  Category overrides
                </p>
                <p className="mb-2 text-[10px] text-text-muted">
                  Leave at the AI's value to accept it. Type a different
                  number to override.
                </p>
                <div className="flex flex-col gap-2">
                  {aiRubricCategories.map((c) => {
                    const override = categoryOverrides.find(
                      (o) => o.category === c.category,
                    );
                    const value = override?.score ?? c.score;
                    return (
                      <div
                        key={c.category}
                        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs text-text-primary">
                          {c.category}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={c.max}
                          value={value}
                          onChange={(e) =>
                            handleOverrideChange(
                              c.category,
                              Number(e.target.value),
                              c.max,
                            )
                          }
                          className="w-16 rounded border border-border bg-surface px-2 py-1 text-right text-xs font-semibold text-text-primary focus:border-brand-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-text-muted">
                          /{c.max}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback */}
            <label className="mt-5 mb-1 block text-xs font-semibold text-text-secondary">
              Feedback for the student
            </label>
            <textarea
              rows={6}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What's working, what needs work, and what to do next."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
            />

            {/* Status */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-text-secondary">
                Status
              </p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { value: 'passed', label: 'Passed' },
                    { value: 'needs_improvement', label: 'Needs improvement' },
                  ] as { value: InstructorReviewStatus; label: string }[]
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={status === opt.value && !requestResubmission}
                      onChange={() => {
                        setStatus(opt.value);
                        setRequestResubmission(false);
                      }}
                    />
                    <span className="text-text-primary">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Request resubmission */}
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-md border border-border bg-surface-secondary p-3 text-sm">
              <input
                type="checkbox"
                checked={requestResubmission}
                onChange={(e) => setRequestResubmission(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <span className="font-medium text-text-primary">
                  Request a new submission
                </span>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  The student's project returns to an editable state and they
                  can submit another attempt. This submission stays in the
                  history.
                </p>
              </div>
            </label>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 w-full"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> Save review
                </>
              )}
            </Button>
          </Card>

          {/* Review history */}
          {reviews.length > 0 && (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <History size={14} className="text-brand-500" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
                  Review history ({reviews.length})
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {reviews.map((r) => (
                  <ReviewHistoryCard key={r._id} review={r} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────────────── */

type TestRun = NonNullable<InstructorSubmissionDetail['testRun']>;

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

const ReviewHistoryCard: React.FC<{ review: InstructorEvaluation }> = ({
  review,
}) => {
  const instructor = review.instructor;
  return (
    <div className="rounded-md border border-border bg-surface-secondary p-3">
      <div className="mb-1 flex items-center gap-2">
        {instructor?.avatar ? (
          <img
            src={instructor.avatar}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-tertiary text-[8px] font-bold text-text-secondary">
            <UserIcon size={10} />
          </span>
        )}
        <span className="text-xs font-medium text-text-primary">
          {instructor?.name ?? 'Instructor'}
        </span>
        <span className="text-[10px] text-text-muted">
          revision {review.revisionNumber}
        </span>
      </div>
      <p className="text-[10px] text-text-muted">
        {formatDate(review.evaluationDate)} · score {review.finalScore} ·{' '}
        {review.status.replace('_', ' ')}
        {review.requestResubmission && ' · resubmit requested'}
      </p>
      <p className="mt-2 whitespace-pre-line text-xs text-text-secondary">
        {review.feedback}
      </p>
    </div>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}