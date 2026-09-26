import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Play,
  Lightbulb,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { ITutorialChallenge } from '@kodxcamp/shared';
import { runChallengeChecks } from '@/shared/runner/checkEngine';
import type { IChallengeRunResult } from '@kodxcamp/shared';
import { CodeEditor } from '@/shared/components/editor/CodeEditor';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';

interface Props {
  challenge: ITutorialChallenge;
  index: number;
  total: number;
  /**
   * The current code the student has for this challenge. Owned by the
   * parent so the code survives navigating away from this challenge
   * and back.
   */
  code: string;
  onCodeChange: (code: string) => void;
  /**
   * True when the student has already completed this challenge (per
   * server state).
   */
  completed: boolean;
  /**
   * True when this is the currently active challenge in the strip.
   */
  active: boolean;
  /**
   * Called when the student passes all checks. The parent decides
   * whether this is a no-op (already complete) or a progress write.
   */
  onPass: () => void;
  /**
   * True when the challenge is locked because the previous challenge
   * hasn't been completed yet.
   */
  locked: boolean;
  /**
   * True when the user isn't signed in. Passing checks still works
   * locally, but the parent won't persist the pass.
   */
  isAnonymous: boolean;
}

export const TutorialChallengeView: React.FC<Props> = ({
  challenge,
  index,
  total,
  code,
  onCodeChange,
  completed,
  active,
  onPass,
  locked,
  isAnonymous,
}) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<IChallengeRunResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  // Reset the run result when the challenge changes so we don't show
  // a stale "passed" from a previous challenge.
  useEffect(() => {
    setResult(null);
    setShowHint(false);
  }, [index]);

  // A challenge is "stale" if the code has changed since the last
  // successful run. We don't clear the result on every keystroke
  // (that would hide the check details while the student reads them);
  // we just mark the top-of-panel status as out of date.
  const [lastRunCode, setLastRunCode] = useState<string | null>(null);
  const codeChangedSinceRun = useMemo(() => {
    if (result === null) return false;
    return lastRunCode !== code;
  }, [result, lastRunCode, code]);

  const run = () => {
    setRunning(true);
    // Synchronous under the hood, but wrap in a microtask so the
    // button's loading state has a frame to render.
    setTimeout(() => {
      const outcome = runChallengeChecks(code, challenge.checks);
      setResult(outcome);
      setLastRunCode(code);
      setRunning(false);

      if (outcome.passed) {
        if (isAnonymous) {
          // No persistence for anonymous students; the parent shows
          // a "sign in to save" note.
          onPass();
        } else {
          setSaveBusy(true);
          onPass();
          // The parent's onPass is async in practice. We don't await
          // it here — the check results are already shown, and the
          // progress write is a background concern.
          setTimeout(() => setSaveBusy(false), 400);
        }
      }
    }, 16);
  };

  if (locked) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface p-8 text-center">
        <Lock size={32} className="text-text-muted" />
        <p className="text-sm font-semibold text-text-primary">
          Challenge {index + 1} is locked
        </p>
        <p className="max-w-md text-xs text-text-muted">
          Complete challenge {index} first to unlock this one.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-secondary px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-xs font-bold',
              completed
                ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                : 'bg-brand-500/10 text-brand-500'
            )}
          >
            {completed ? (
              <CheckCircle2 size={14} />
            ) : (
              index + 1
            )}
          </span>
          <p className="truncate text-sm font-semibold text-text-primary">
            {challenge.title}
          </p>
          <span className="text-[10px] text-text-muted">
            {index + 1} of {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={run}
            disabled={running || saveBusy || !active}
            className="btn-press"
          >
            {running ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {running ? 'Checking…' : 'Run Checks'}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-text-secondary">
          {challenge.instructions}
        </div>
        {challenge.hint && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
            >
              <Lightbulb size={12} />
              {showHint ? 'Hide hint' : 'Show hint'}
            </button>
            {showHint && (
              <p className="mt-2 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-text-muted">
                {challenge.hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={challenge.language === 'html' ? 'html' : 'plaintext'}
          value={code}
          onChange={onCodeChange}
        />
      </div>

      {/* Check results */}
      <div className="shrink-0 border-t border-border bg-surface-secondary p-3">
        {result === null ? (
          <p className="text-xs text-text-muted">
            Run the checks to see if your solution is correct.
          </p>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              {result.passed ? (
                <>
                  <CheckCircle2
                    size={14}
                    className="text-[var(--color-success)]"
                  />
                  <span className="text-xs font-semibold text-[var(--color-success)]">
                    All {result.results.length} check
                    {result.results.length === 1 ? '' : 's'} passed
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={14} className="text-[var(--color-error)]" />
                  <span className="text-xs font-semibold text-[var(--color-error)]">
                    {result.results.filter((r) => r.passed).length} of{' '}
                    {result.results.length} checks passed
                  </span>
                </>
              )}
              {codeChangedSinceRun && (
                <span className="ml-auto text-[10px] italic text-text-muted">
                  Code changed since last run
                </span>
              )}
            </div>

            <ul className="flex flex-col gap-1.5">
              {result.results.map((r, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-2 py-1.5 text-xs',
                    r.passed
                      ? 'bg-[var(--color-success)]/5 text-[var(--color-success)]'
                      : 'bg-[var(--color-error)]/5 text-[var(--color-error)]'
                  )}
                >
                  {r.passed ? (
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={12} className="mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {r.check.label ?? checkDefaultLabel(r.check)}
                    </span>
                    {r.message && (
                      <p className="mt-0.5 text-[10px] opacity-80">
                        {r.message}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {result.passed && isAnonymous && (
              <p className="mt-3 text-[10px] text-text-muted">
                <Unlock size={10} className="mr-1 inline" />
                Sign in to save your progress on this challenge.
              </p>
            )}

            {result.passed && !isAnonymous && (
              <p className="mt-3 flex items-center gap-1 text-[10px] font-medium text-[var(--color-success)]">
                <ArrowRight size={10} />
                {index + 1 < total
                  ? 'Move on to the next challenge when you are ready.'
                  : 'You have finished every challenge in this lesson.'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function checkDefaultLabel(
  check: ITutorialChallenge['checks'][number]
): string {
  if (check.type === 'includes') {
    return `Contains "${truncate(check.value)}"`;
  }
  if (check.expect === 'exists') {
    return `Has a "${check.selector}" element`;
  }
  if (check.expect === 'textEquals') {
    return `"${check.selector}" says "${truncate(check.value ?? '')}"`;
  }
  return `"${check.selector}" matches /${truncate(check.value ?? '')}/`;
}

function truncate(s: string, max = 40): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}