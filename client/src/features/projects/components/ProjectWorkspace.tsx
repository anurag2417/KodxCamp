import { useEffect, useMemo, useRef, useState } from 'react';
import { Save, CheckCircle2, RotateCw, Send } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/shared/components/ui/Button';
import { CodeEditor } from '@/shared/components/editor/CodeEditor';
import { FileTabs } from '@/features/projects/components/FileTabs';
import { PreviewPane } from '@/features/projects/components/PreviewPane';
import {
  projectsApi,
  type ApiProjectFile,
  type ApiUserProject,
  type ApiProjectSubmission,
  type PreviewMode,
  type ApiProjectFull,
} from '@/features/projects/api';
import { runProjectTests } from '@/shared/runner/projectTestEngine';
import { captureProjectScreenshots } from '@/shared/runner/screenshotRunner';
import { useAuthStore } from '@/shared/store/auth.store';
import { useToast } from '@/shared/hooks/useToast';

interface Props {
  projectSlug: string;
  initialFiles: ApiProjectFile[];
  previewMode: PreviewMode;
  /**
   * The automated tests to run on submit. Passed down from
   * `ProjectDetail`, which has the full `ApiProjectFull` in hand.
   */
  tests: ApiProjectFull['tests'];
  userProject: ApiUserProject | null;
  onSaved?: (up: ApiUserProject) => void;
  onCompleted?: () => void;
  /**
   * Called after a successful submission with the new submission row.
   * The parent uses this to refresh the submission history.
   */
  onSubmitted?: (submission: ApiProjectSubmission) => void;
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
  tests,
  userProject,
  onSaved,
  onCompleted,
  onSubmitted,
}) => {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [files, setFiles] = useState<ApiProjectFile[]>(initialFiles);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, initialFiles.findIndex((f) => f.isEntry))
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<
    'idle' | 'saving' | 'testing' | 'capturing' | 'posting'
  >('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [runKey, setRunKey] = useState(0);

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
    } catch {
      toast.error('Could not save your project');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Submit flow.
   *
   *   1. Save the workspace if there are unsaved changes, so the
   *      server-side record matches what the student sees.
   *   2. Run the automated tests (client-side, sandboxed iframe).
   *   3. Capture desktop and mobile screenshots (client-side,
   *      html2canvas on a script-stripped copy).
   *   4. POST the submission with both artifacts.
   *
   * Steps 2 and 3 run in parallel after the save — they are
   * independent and both are slow. Serializing them would double the
   * wall-clock wait on the button.
   *
   * Both artifacts are best-effort: if the test runner times out or
   * the screenshot capture throws, the submission still goes
   * through. The artifacts are optional on the server; a submission
   * without them is a valid submission.
   */
  const submit = async () => {
    if (!user) {
      toast.info('Sign in to submit your project.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1 — save if dirty.
      if (dirty) {
        setSubmitStage('saving');
        const up = await projectsApi.save(projectSlug, files);
        setSavedAt(new Date());
        setDirty(false);
        onSaved?.(up);
      }

      // Steps 2 and 3 — run tests and capture screenshots in parallel.
      setSubmitStage(tests.length > 0 ? 'testing' : 'capturing');

      const testPromise: Promise<
        Awaited<ReturnType<typeof runProjectTests>> | undefined
      > =
        tests.length > 0
          ? runProjectTests(files, tests, previewMode).catch((err) => {
              // runProjectTests never throws, but be defensive.
              console.warn('[submit] test runner failed', err);
              return undefined;
            })
          : Promise.resolve(undefined);

      const shotPromise = captureProjectScreenshots(files, previewMode).catch(
        (err) => {
          // captureProjectScreenshots never throws, but be defensive.
          console.warn('[submit] screenshot runner failed', err);
          return undefined;
        }
      );

      const [testRun, screenshots] = await Promise.all([
        testPromise,
        shotPromise,
      ]);

      // Step 4 — post the submission.
      setSubmitStage('posting');
      const submission = await projectsApi.submit(projectSlug, {
        files,
        testRun,
        screenshots,
      });

      const summary =
        testRun && testRun.totalTests > 0
          ? ` (${testRun.passedTests}/${testRun.totalTests} tests passed)`
          : '';
      toast.success(
        `Submission #${submission.attemptNumber} recorded${summary}`
      );
      onSubmitted?.(submission);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not submit your project'
      );
    } finally {
      setSubmitting(false);
      setSubmitStage('idle');
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
      toast.error('Could not complete the project');
    }
  };

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

  const submitLabel = (() => {
    switch (submitStage) {
      case 'saving':
        return 'Saving…';
      case 'testing':
        return 'Running tests…';
      case 'capturing':
        return 'Capturing…';
      case 'posting':
        return 'Submitting…';
      default:
        return 'Submit';
    }
  })();

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
                  <span className="text-xs text-[var(--color-warning)]">
                    Unsaved
                  </span>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={complete}
                  disabled={!user || submitting}
                >
                  <CheckCircle2 size={14} /> Complete
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={save}
                  disabled={!user || saving || submitting}
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={!user || submitting}
                >
                  <Send size={14} /> {submitLabel}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={runNow}
                  disabled={submitting}
                >
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