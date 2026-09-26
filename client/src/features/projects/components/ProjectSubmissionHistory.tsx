import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  CircleAlert,
  XCircle,
  Eye,
  EyeOff,
  ListChecks,
  Image as ImageIcon,
  MessageSquare,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import type {
  ApiProjectSubmission,
  ProjectSubmissionStatus,
} from '@/features/projects/api';
import { cn } from '@/shared/lib/utils';

interface Props {
  submissions: ApiProjectSubmission[];
  loading: boolean;
  /**
   * Called when the student clicks "Resubmit". Optional — if absent,
   * the Resubmit button is not rendered. The parent decides what
   * "resubmit" means (scroll to the workspace, focus the editor, or
   * just close the history).
   */
  onResubmit?: () => void;
}

export const ProjectSubmissionHistory: React.FC<Props> = ({
  submissions,
  loading,
  onResubmit,
}) => {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-xs text-text-muted">
        Loading submissions…
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
        <p className="text-sm font-medium text-text-primary">
          No submissions yet
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Your first submission will appear here. Every attempt you make is
          kept separately, so you can track your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {submissions.map((s) => (
        <SubmissionRow
          key={s._id}
          submission={s}
          onResubmit={onResubmit}
        />
      ))}
    </div>
  );
};

/* ─── Row ────────────────────────────────────────────────────────── */

const SubmissionRow: React.FC<{
  submission: ApiProjectSubmission;
  onResubmit?: () => void;
}> = ({ submission, onResubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showShots, setShowShots] = useState(false);

  const testRun = submission.testRun;
  const hasTests = testRun && testRun.totalTests > 0;
  const hasShots = Boolean(
    submission.screenshots &&
      (submission.screenshots.desktop || submission.screenshots.mobile),
  );

  const instructorFeedback = submission.instructorFeedback;
  const showResubmit =
    submission.status === 'resubmission_requested' && Boolean(onResubmit);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-500/10 font-mono text-xs font-bold text-brand-500">
            #{submission.attemptNumber}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">
              Attempt {submission.attemptNumber}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
              <Clock size={11} />
              {formatDate(submission.submittedAt)}
              {hasTests && (
                <>
                  <span className="opacity-50">·</span>
                  <span
                    className={cn(
                      'font-medium',
                      testRun.allPassed
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-warning)]',
                    )}
                  >
                    {testRun.passedTests}/{testRun.totalTests} tests
                  </span>
                </>
              )}
              {instructorFeedback && (
                <>
                  <span className="opacity-50">·</span>
                  <span className="font-medium text-brand-500">
                    reviewed {instructorFeedback.finalScore}/100
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={submission.status} />
          {expanded ? (
            <ChevronUp size={14} className="text-text-muted" />
          ) : (
            <ChevronDown size={14} className="text-text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {/* Instructor feedback */}
          {instructorFeedback && (
            <div className="mb-3 rounded-md border border-brand-500/30 bg-brand-500/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare size={12} className="text-brand-500" />
                <span className="text-xs font-semibold text-brand-500">
                  Instructor feedback
                </span>
                <span className="text-[10px] text-text-muted">
                  score {instructorFeedback.finalScore}/100
                </span>
              </div>
              <p className="whitespace-pre-line text-xs text-text-secondary">
                {instructorFeedback.feedback}
              </p>
              {instructorFeedback.categoryOverrides &&
                instructorFeedback.categoryOverrides.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {instructorFeedback.categoryOverrides.map((o) => (
                      <span
                        key={o.category}
                        className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-secondary"
                      >
                        {o.category}: {o.score}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          )}

          {submission.notes && (
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Your notes
              </p>
              <p className="whitespace-pre-line rounded-md bg-surface-secondary p-3 text-xs text-text-secondary">
                {submission.notes}
              </p>
            </div>
          )}

          {hasTests && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowTests((v) => !v)}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
              >
                <ListChecks size={12} />
                {showTests
                  ? 'Hide test results'
                  : `View test results (${testRun.passedTests}/${testRun.totalTests} passed)`}
              </button>
              {showTests && <TestResults testRun={testRun} />}
            </div>
          )}

          {hasShots && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowShots((v) => !v)}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
              >
                <ImageIcon size={12} />
                {showShots ? 'Hide screenshots' : 'View screenshots'}
              </button>
              {showShots && <Screenshots submission={submission} />}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowFiles((v) => !v)}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
          >
            {showFiles ? <EyeOff size={12} /> : <Eye size={12} />}
            {showFiles ? 'Hide submitted files' : 'View submitted files'}
          </button>

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
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-text-primary">
                    {f.content || '(empty)'}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {showResubmit && (
            <div className="mt-4 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-3">
              <p className="text-xs text-[var(--color-warning)]">
                Your instructor has requested a new submission.
              </p>
              <button
                type="button"
                onClick={onResubmit}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
              >
                <RotateCcw size={12} /> Start a new attempt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Test results ───────────────────────────────────────────────── */

const TestResults: React.FC<{
  testRun: NonNullable<ApiProjectSubmission['testRun']>;
}> = ({ testRun }) => {
  if (testRun.error) {
    return (
      <div className="rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-3 text-xs text-[var(--color-warning)]">
        <p className="font-medium">Test run did not complete</p>
        <p className="mt-1 opacity-90">{testRun.error}</p>
      </div>
    );
  }

  return (
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
              <p className="mt-0.5 text-[10px] opacity-80">{r.message}</p>
            )}
            {!r.message && !r.passed && r.actual && (
              <p className="mt-0.5 text-[10px] opacity-80">
                Actual: {r.actual}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Screenshots ────────────────────────────────────────────────── */

const Screenshots: React.FC<{ submission: ApiProjectSubmission }> = ({
  submission,
}) => {
  const shots = submission.screenshots;
  if (!shots) return null;

  return (
    <div className="flex flex-col gap-3">
      {shots.error && (
        <p className="rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 px-2 py-1 text-[10px] text-[var(--color-warning)]">
          {shots.error}
        </p>
      )}
      {shots.desktop && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Desktop ({shots.desktop.width}×{shots.desktop.height})
          </p>
          <img
            src={shots.desktop.dataUrl}
            alt="Desktop screenshot"
            className="w-full rounded-md border border-border"
          />
        </div>
      )}
      {shots.mobile && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Mobile ({shots.mobile.width}×{shots.mobile.height})
          </p>
          <img
            src={shots.mobile.dataUrl}
            alt="Mobile screenshot"
            className="max-w-[240px] rounded-md border border-border"
          />
        </div>
      )}
    </div>
  );
};

/* ─── Status badge ───────────────────────────────────────────────── */

const STATUS_META: Record<
  ProjectSubmissionStatus,
  { label: string; tone: string; icon: LucideIcon }
> = {
  submitted: {
    label: 'Submitted',
    tone: 'bg-brand-500/10 text-brand-500',
    icon: Clock,
  },
  ai_evaluated: {
    label: 'AI Evaluated',
    tone: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
    icon: CircleAlert,
  },
  instructor_reviewed: {
    label: 'Reviewed',
    tone: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
    icon: CircleAlert,
  },
  passed: {
    label: 'Passed',
    tone: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    icon: CheckCircle2,
  },
  needs_improvement: {
    label: 'Needs Improvement',
    tone: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    icon: CircleAlert,
  },
  resubmission_requested: {
    label: 'Resubmission Requested',
    tone: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    icon: XCircle,
  },
};

const StatusBadge: React.FC<{ status: ProjectSubmissionStatus }> = ({
  status,
}) => {
  const meta = STATUS_META[status] ?? STATUS_META.submitted;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
        meta.tone,
      )}
    >
      <Icon size={10} />
      {meta.label}
    </span>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}