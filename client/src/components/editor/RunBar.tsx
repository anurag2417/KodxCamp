import { Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface RunBarProps {
  /** Left side: language selector, file tabs, etc. */
  left?: React.ReactNode;
  /** Right side: additional buttons (Save, Submit, Complete) */
  right?: React.ReactNode;
  /** Run button */
  onRun: () => void;
  running?: boolean;
  /** Run button label — defaults to "Run" */
  runLabel?: string;
  /** Hide the Run button entirely if not applicable (e.g. read-only views) */
  hideRun?: boolean;
  className?: string;
}

export const RunBar: React.FC<RunBarProps> = ({
  left,
  right,
  onRun,
  running = false,
  runLabel = 'Run',
  hideRun = false,
  className,
}) => (
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
        <Button size="sm" onClick={onRun} disabled={running}>
          <Play size={14} />
          {running ? 'Running...' : runLabel}
        </Button>
      )}
    </div>
  </div>
);