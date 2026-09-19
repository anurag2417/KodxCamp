import { Play, Send, Loader2, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface Props {
  languages: readonly string[];
  language: string;
  onLanguageChange: (l: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  running: boolean;
  canSubmit: boolean;
  pyReady?: boolean;
}

export const EditorToolbar: React.FC<Props> = ({
  languages,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  running,
  canSubmit,
  pyReady,
}) => {
  const showPyLoading = language === 'python' && !pyReady;

  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-secondary px-3">
      {/* Language selector */}
      <div className="flex items-center gap-1 rounded-lg bg-surface p-0.5">
        {languages.map((l) => (
          <button
            key={l}
            onClick={() => onLanguageChange(l)}
            disabled={running}
            className={cn(
              'relative rounded-md px-2.5 py-1 text-xs font-medium capitalize',
              'panel-transition',
              language === l
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {l === 'javascript'
              ? 'JavaScript'
              : l.charAt(0).toUpperCase() + l.slice(1)}
            {l === 'python' && showPyLoading && (
              <span
                className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70"
                title="Loading Python runtime…"
              />
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onRun}
          disabled={running}
          className="btn-press"
        >
          {running ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          Run
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={running || !canSubmit}
          className="btn-press"
        >
          {running ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Submit
        </Button>
      </div>
    </div>
  );
};