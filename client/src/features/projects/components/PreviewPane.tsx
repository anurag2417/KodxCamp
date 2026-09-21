import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { buildPreviewHtml } from '@/features/projects/previewBuilder';
import type { ApiProjectFile, PreviewMode } from '@/features/projects/api';

interface Props {
  files: ApiProjectFile[];
  previewMode: PreviewMode;
  /** Bump this number to trigger a manual refresh */
  refreshKey?: number;
}

export const PreviewPane: React.FC<Props> = ({ files, previewMode, refreshKey = 0 }) => {
  const [debouncedFiles, setDebouncedFiles] = useState(files);
  const [manualKey, setManualKey] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Debounce file changes by 700ms
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setDebouncedFiles(files), 700);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [files]);

  const html = useMemo(
    () => buildPreviewHtml(debouncedFiles, previewMode),
    [debouncedFiles, previewMode]
  );

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Preview
        </span>
        <Button size="sm" variant="ghost" onClick={() => setManualKey((k) => k + 1)}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>
      <div className="flex-1 bg-white">
        <iframe
          key={`${manualKey}-${refreshKey}`}
          title="Project preview"
          srcDoc={html}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
};
