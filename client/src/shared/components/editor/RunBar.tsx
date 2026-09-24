import { Play, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';

interface RunBarProps {
  /** Left side: language selector, file tabs, etc. */
  left?: React.ReactNode;
  /** Right side: additional buttons (Save, Complete, etc). Rendered before Run/Submit. */
  right?: React.ReactNode;
  /** Run button */
  onRun: () => void;
  running?: boolean;
  /** Run button label - defaults to "Run" */
  runLabel?: string;
  /** Hide the Run button entirely if not applicable (e.g. read-only views) */
  hideRun?: boolean;

  /**
   * Optional Submit button. When provided (and not hidden), a second
   * button renders to the right of Run. Use this for lessons that
   * need an explicit "check my work" action separate from "just run it".
   */
  onSubmit?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  hideSubmit?: boolean;

  /**
   * Optional "Mark as Complete" button. When provided, it renders
   * between Submit and Run. When `completed` is true, it renders in a
   * disabled/secondary state with a checkmark.
   *
   * Disabled rule is owned by the caller: pass `markCompleteDisabled`
   * explicitly so the toolbar doesn't have to know about tests,
   * login state, or step gating.
   */
  onMarkComplete?: () => void;
  markCompleteDisabled?: boolean;
  markCompleteBusy?: boolean;
  completed?: boolean;
  markCompleteLabel?: string;

  className?: string;
}

export const RunBar: React.FC<RunBarProps> = ({
  left,
  right,
  onRun,
  running = false,
  runLabel = 'Run',
  hideRun = false,
  onSubmit,
  submitting = false,
  submitLabel = 'Submit',
  hideSubmit = false,
  onMarkComplete,
  markCompleteDisabled = false,
  markCompleteBusy = false,
  completed = false,
  markCompleteLabel = 'Mark as Complete',
  className,
}) => {
  const showSubmit = !!onSubmit && !hideSubmit;
  const showMarkComplete = !!onMarkComplete;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border bg-surface-secondary px-4 py-2',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        {left}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        {!hideRun && (
          <Button
            size="sm"
            variant={showSubmit ? 'secondary' : 'primary'}
            onClick={onRun}
            disabled={running || submitting || markCompleteBusy}
          >
            {running ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {running ? 'Running...' : runLabel}
          </Button>
        )}
        {showSubmit && (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={running || submitting || markCompleteBusy}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {submitting ? 'Checking...' : submitLabel}
          </Button>
        )}
        {showMarkComplete && (
          <Button
            size="sm"
            variant={completed ? 'secondary' : 'primary'}
            onClick={onMarkComplete}
            disabled={
              completed ||
              markCompleteDisabled ||
              running ||
              submitting ||
              markCompleteBusy
            }
            title={
              completed
                ? 'Already completed'
                : markCompleteDisabled
                  ? 'Pass the checks to enable this'
                  : markCompleteLabel
            }
          >
            {markCompleteBusy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {completed ? 'Completed' : markCompleteBusy ? 'Saving...' : markCompleteLabel}
          </Button>
        )}
      </div>
    </div>
  );
};