import { useEffect, useMemo, useRef, useState } from 'react';
import { Save, CheckCircle2, RotateCw } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '../ui/Button';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTabs } from './FileTabs';
import { PreviewPane } from './PreviewPane';
import {
  projectsApi,
  type ApiProjectFile,
  type ApiUserProject,
  type PreviewMode,
} from '../../lib/projects.api';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  projectSlug: string;
  initialFiles: ApiProjectFile[];
  previewMode: PreviewMode;
  userProject: ApiUserProject | null;
  onSaved?: (up: ApiUserProject) => void;
  onCompleted?: () => void;
}

const monacoLangByFile: Record<string, string> = {
  html: 'html',
  css: 'css',
  javascript: 'javascript',
  jsx: 'javascript',
  sql: 'sql',
  json: 'json',
  markdown: 'markdown',
};

export const ProjectWorkspace: React.FC<Props> = ({
  projectSlug,
  initialFiles,
  previewMode,
  userProject,
  onSaved,
  onCompleted,
}) => {
  const user = useAuthStore((s) => s.user);
  const [files, setFiles] = useState<ApiProjectFile[]>(initialFiles);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, initialFiles.findIndex((f) => f.isEntry))
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [runKey, setRunKey] = useState(0);

  // Adopt-once per userProject id
  const adoptedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!userProject) return;
    if (adoptedIdRef.current === userProject._id) return;
    if (!userProject.files?.length) return;
    setFiles(userProject.files);
    setActiveIndex(Math.max(0, userProject.files.findIndex((f) => f.isEntry)));
    setDirty(false);
    adoptedIdRef.current = userProject._id;
  }, [userProject]);

  // Warn on unload with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const activeFile = files[activeIndex];

  const updateFile = (content: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeIndex ? { ...f, content } : f))
    );
    setDirty(true);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const up = await projectsApi.save(projectSlug, files);
      setSavedAt(new Date());
      setDirty(false);
      onSaved?.(up);
    } finally {
      setSaving(false);
    }
  };

  const complete = async () => {
    if (!user) return;
    if (dirty && !confirm('You have unsaved changes. Save before completing?')) {
      return;
    }
    try {
      if (dirty) await save();
      await projectsApi.complete(projectSlug);
      onCompleted?.();
    } catch {
      /* ignore */
    }
  };

  /** Run the current files immediately — force-refresh the preview iframe. */
  const runNow = () => {
    setRunKey((k) => k + 1);
  };

  const editorLanguage = useMemo(
    () =>
      activeFile
        ? monacoLangByFile[activeFile.language] ?? 'plaintext'
        : 'plaintext',
    [activeFile]
  );

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col">
      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={55} minSize={30}>
          <div className="flex h-full flex-col bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-secondary px-4 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                <FileTabs
                  files={files}
                  activeIndex={activeIndex}
                  onChange={setActiveIndex}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {savedAt && !dirty && (
                  <span className="hidden items-center gap-1 text-xs text-text-muted sm:inline-flex">
                    <CheckCircle2
                      size={12}
                      className="text-[var(--color-success)]"
                    />
                    Saved
                  </span>
                )}
                {dirty && (
                  <span className="text-xs text-[var(--color-warning)]">Unsaved</span>
                )}
                <Button size="sm" variant="secondary" onClick={complete}>
                  <CheckCircle2 size={14} /> Complete
                </Button>
                <Button size="sm" onClick={save} disabled={!user || saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="secondary" onClick={runNow}>
                  <RotateCw size={14} /> Run
                </Button>
              </div>
            </div>
            <div className="flex-1">
              {activeFile && (
                <CodeEditor
                  language={editorLanguage}
                  value={activeFile.content}
                  onChange={updateFile}
                />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        <Panel defaultSize={45} minSize={25}>
          <PreviewPane
            files={files}
            previewMode={previewMode}
            refreshKey={runKey}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};