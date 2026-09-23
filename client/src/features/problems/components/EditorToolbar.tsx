import { Play, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { preloadNow, type PreloadStatus } from '@/shared/runner/preloadManager';

interface Language {
  id: string;
  label: string;
}

interface Props {
  languages: readonly Language[];
  language: string;
  onLanguageChange: (l: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  running: boolean;
  canSubmit: boolean;
  /** Warm-up status per language id. */
  preloadStatus?: Record<string, PreloadStatus>;
}

export const EditorToolbar: React.FC<Props> = ({
  languages,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  running,
  canSubmit,
  preloadStatus = {},
}) => {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-secondary px-3">
      <div className="flex items-center gap-1 rounded-lg bg-surface p-0.5">
        {languages.map((l) => {
          const status = preloadStatus[l.id] ?? 'idle';
          return (
            <button
              key={l.id}
              onClick={() => onLanguageChange(l.id)}
              onMouseEnter={() => {
                // Warm up on hover so the runtime is ready if the user
                // commits to this language.
                if (status === 'idle') void preloadNow(l.id);
              }}
              disabled={running}
              className={cn(
                'relative rounded-md px-2.5 py-1 text-xs font-medium',
                'panel-transition',
                language === l.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {l.label}
              <StatusDot status={status} />
            </button>
          );
        })}
      </div>

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

const StatusDot: React.FC<{ status: PreloadStatus }> = ({ status }) => {
  if (status === 'ready') {
    return (
      <CheckCircle2
        size={10}
        className="ml-1.5 inline-block align-middle text-[var(--color-success)] opacity-80"
      />
    );
  }
  if (status === 'loading' || status === 'pending') {
    return (
      <span
        className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70"
        title="Loading runtime…"
      />
    );
  }
  if (status === 'error') {
    return (
      <AlertCircle
        size={10}
        className="ml-1.5 inline-block align-middle text-[var(--color-error)]"
        aria-label="Failed to load runtime"
      />
    );
  }
  return null;
};