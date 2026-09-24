import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useLesson } from '@/features/courses/hooks/useLesson';
import { useAuthStore } from '@/shared/store/auth.store';
import { progressApi, type ApiProgress } from '@/features/progress/api';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { CodeEditor } from '@/shared/components/editor/CodeEditor';
import { RunBar } from '@/shared/components/editor/RunBar';
import { LessonSidebar } from '@/features/courses/components/LessonSidebar';
import {
  runTests,
  type TestRunSummary,
  type VisibleTestCase,
} from '@/shared/runner/testHarness';
import { TestPanel } from '@/features/problems/components/TestPanel';
import { readStoredValue, writeStoredValue } from '@/shared/lib/storage';
import { buildPreviewHtml } from '@/shared/lib/preview';
import { CourseQuiz } from '@/features/courses/components/CourseQuiz';
import { cn } from '@/shared/lib/utils';
import type { ApiWebLessonStep } from '@/features/courses/api';

const WEB_FILES = ['index.html', 'styles.css', 'script.js'] as const;
type WebFile = (typeof WEB_FILES)[number];

const AUTO_PREVIEW_DEBOUNCE_MS = 400;

function toMonacoLanguage(langOrFile: string): string {
  switch (langOrFile) {
    case 'index.html':
      return 'html';
    case 'styles.css':
      return 'css';
    case 'script.js':
      return 'javascript';

    case 'html-css':
    case 'tailwind':
      return 'html';
    case 'react':
      return 'javascript';
    case 'javascript':
    case 'dsa-javascript':
      return 'javascript';
    case 'typescript':
      return 'typescript';
    case 'python':
    case 'dsa-python':
      return 'python';
    case 'ruby':
      return 'ruby';
    case 'java':
      return 'java';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}

export const Lesson: React.FC = () => {
  const { courseSlug, lessonSlug } = useParams<{
    courseSlug: string;
    lessonSlug: string;
  }>();
  const { data, loading, error } = useLesson(courseSlug, lessonSlug);
  const user = useAuthStore((s) => s.user);

  const [code, setCode] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<WebFile>(WEB_FILES[0]);
  const [summary, setSummary] = useState<TestRunSummary | undefined>();
  const [accepted, setAccepted] = useState(false);
  const [totalRuntimeMs, setTotalRuntimeMs] = useState(0);
  const [progress, setProgress] = useState<ApiProgress | null>(null);
  const [completing, setCompleting] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [webPreview, setWebPreview] = useState('');
  const [webMessage, setWebMessage] = useState('');
  const [savingStep, setSavingStep] = useState(false);

  const initializedForRef = useRef<string | null>(null);
  const hasEditedRef = useRef(false);

  const isWebLesson = isWebLessonLanguage(lessonLanguage(data?.lesson?.language));
  const steps: ApiWebLessonStep[] = data?.lesson.steps ?? [];
  const hasSteps = isWebLesson && steps.length > 0;

  const currentStepIndex = useMemo(() => {
    if (!hasSteps) return 0;
    const idx = progress?.currentStepIndex ?? 0;
    return Math.max(0, Math.min(idx, steps.length - 1));
  }, [hasSteps, progress?.currentStepIndex, steps.length]);

  const currentStep = hasSteps ? steps[currentStepIndex] : null;
  const completedSteps = useMemo(
    () => new Set(progress?.completedSteps ?? []),
    [progress?.completedSteps]
  );

  useEffect(() => {
    if (!data?.lesson) return;
    if (!isWebLesson) return;

    const key = hasSteps
      ? `${data.lesson._id}:${currentStepIndex}`
      : `${data.lesson._id}:classic`;

    if (initializedForRef.current === key) return;

    const stored = readStoredValue<{
      files?: Record<string, string>;
      activeFile?: string;
      stepIndex?: number;
    }>(`lesson:${user?._id ?? 'guest'}:${data.lesson._id}`);

    const stepStarter = currentStep?.starterFiles ?? null;
    const prevStepStarter =
      currentStepIndex > 0 ? steps[currentStepIndex - 1].starterFiles : null;

    const isFirstLoadForLesson =
      stored === null || stored.stepIndex === undefined;

    const lessonStarterFiles = data.lesson.starterFiles ?? {
      'index.html': data.lesson.starterCode || '',
      'styles.css': '',
      'script.js': '',
    };

    if (!hasSteps) {
      if (stored?.files) {
        setFiles(stored.files);
      } else {
        setFiles({
          'index.html': lessonStarterFiles['index.html'] ?? '',
          'styles.css': lessonStarterFiles['styles.css'] ?? '',
          'script.js': lessonStarterFiles['script.js'] ?? '',
        });
      }
    } else if (isFirstLoadForLesson) {
      if (stepStarter) {
        setFiles({
          'index.html': stepStarter['index.html'] ?? '',
          'styles.css': stepStarter['styles.css'] ?? '',
          'script.js': stepStarter['script.js'] ?? '',
        });
      } else {
        setFiles({
          'index.html': lessonStarterFiles['index.html'] ?? '',
          'styles.css': lessonStarterFiles['styles.css'] ?? '',
          'script.js': lessonStarterFiles['script.js'] ?? '',
        });
      }
    } else if (stored.stepIndex === currentStepIndex) {
      if (stored.files) {
        setFiles(stored.files);
      }
    } else {
      const currentFiles = files;
      const merged: Record<string, string> = { ...currentFiles };

      if (stepStarter) {
        for (const fileName of WEB_FILES) {
          const nextStarter = stepStarter[fileName] ?? '';
          const prevStarter = prevStepStarter?.[fileName] ?? '';
          const authorChangedThisFile =
            nextStarter.length > 0 && nextStarter !== prevStarter;
          if (authorChangedThisFile) {
            merged[fileName] = nextStarter;
          }
        }
      }

      setFiles(merged);
    }

    setActiveFile(
      stored?.activeFile && WEB_FILES.includes(stored.activeFile as WebFile)
        ? (stored.activeFile as WebFile)
        : WEB_FILES[0]
    );

    setSummary(undefined);
    setAccepted(false);
    setWebMessage('');
    setWebPreview('');
    hasEditedRef.current = false;

    initializedForRef.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.lesson?._id, currentStepIndex, isWebLesson, hasSteps]);

  useEffect(() => {
    if (!data?.lesson || isWebLesson) return;

    const key = `code:${data.lesson._id}`;
    if (initializedForRef.current === key) return;

    const stored = readStoredValue<{ code?: string }>(
      `lesson:${user?._id ?? 'guest'}:${data.lesson._id}`
    );

    setCode(stored?.code ?? data.lesson.starterCode ?? '');
    setSummary(undefined);
    setAccepted(false);

    initializedForRef.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.lesson?._id, isWebLesson, user?._id]);

  useEffect(() => {
    if (!user || !data?.course) return;
    progressApi
      .getForCourse(data.course._id)
      .then(setProgress)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, data?.course?._id]);

  const testCases = useMemo(() => data?.lesson.testCases ?? [], [data?.lesson]);
  const hasTests = testCases.length > 0;
  const activeCode = isWebLesson ? files[activeFile] ?? '' : code;

  useEffect(() => {
    if (!data?.lesson || !activeCode) return;
    writeStoredValue(`lesson:${user?._id ?? 'guest'}:${data.lesson._id}`, {
      code: isWebLesson ? undefined : code,
      files: isWebLesson ? files : undefined,
      activeFile: isWebLesson ? activeFile : undefined,
      stepIndex: hasSteps ? currentStepIndex : undefined,
    });
  }, [
    activeCode,
    activeFile,
    code,
    data?.lesson,
    files,
    isWebLesson,
    user?._id,
    hasSteps,
    currentStepIndex,
  ]);

  useEffect(() => {
    if (!isWebLesson) return;
    if (Object.keys(files).length === 0) return;
    if (!hasEditedRef.current) return;

    const id = window.setTimeout(() => {
      setWebPreview(buildPreviewHtml(files));
    }, AUTO_PREVIEW_DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [files, isWebLesson]);

  const validateCurrentWebFiles = (): { ok: boolean; message: string } => {
    const checks = currentStep?.webChecks ?? data?.lesson?.webChecks;
    return validateWebFiles(files, checks);
  };

  const handleRunCode = async () => {
    if (!data) return;
    setRunning(true);

    if (isWebLesson) {
      setWebMessage('');
      setWebPreview(buildPreviewHtml(files));
      setRunning(false);
      return;
    }

    setSummary(undefined);
    setAccepted(false);

    const visibleCases: VisibleTestCase[] = testCases.map((tc) => ({
      index: tc.index,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
    }));

    const result = await runTests(data.lesson.language, activeCode, visibleCases, {
      functionName: data.lesson.functionName ?? 'solve',
      outputMode: data.lesson.outputMode ?? 'print',
    });

    setSummary(result);
    setAccepted(result.allPassed);
    setTotalRuntimeMs(result.totalRuntimeMs);
    setRunning(false);
  };

  const handleSubmitWeb = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      setWebPreview(buildPreviewHtml(files));
      const result = validateCurrentWebFiles();
      setWebMessage(result.message);
      setAccepted(result.ok);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    if (!hasSteps || !data?.course || !data?.lesson) return;
    if (!accepted) return;

    initializedForRef.current = null;
    hasEditedRef.current = false;

    if (!user) {
      const next = Math.min(currentStepIndex + 1, steps.length - 1);
      setProgress((prev) => ({
        _id: prev?._id ?? null,
        userId: '',
        courseId: data.course._id,
        completedLessons: prev?.completedLessons ?? [],
        currentLessonId: data.lesson._id,
        currentStepIndex: next,
        completedSteps: Array.from(
          new Set([...(prev?.completedSteps ?? []), currentStepIndex])
        ).sort((a, b) => a - b),
        percentage: prev?.percentage ?? 0,
      }));
      setAccepted(false);
      setWebMessage('');
      setWebPreview('');
      return;
    }

    setSavingStep(true);
    try {
      const updated = await progressApi.markStepComplete(
        data.course._id,
        data.lesson._id,
        currentStepIndex
      );
      setProgress(updated);
      setAccepted(false);
      setWebMessage('');
      setWebPreview('');
    } catch {
      /* leave student on current step */
    } finally {
      setSavingStep(false);
    }
  };

  const markComplete = async () => {
    if (!user) return;
    if (!data?.course || !data?.lesson) return;
    setCompleting(true);
    try {
      const updated = await progressApi.markComplete(
        data.course._id,
        data.lesson._id
      );
      setProgress(updated);
    } finally {
      setCompleting(false);
    }
  };

  const handleFileChange = (fileName: WebFile, value: string) => {
    hasEditedRef.current = true;
    setFiles((current) => ({ ...current, [fileName]: value }));
  };

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full p-8">
        <p className="text-[var(--color-error)]">{error ?? 'Lesson not found'}</p>
        <Link
          to="/courses"
          className="mt-4 inline-block text-brand-500 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  const { course, lesson } = data;
  const isCompleted = progress?.completedLessons.includes(lesson._id) ?? false;
  const canComplete = hasSteps ? false : !hasTests || accepted;
  const isLastStep = hasSteps && currentStepIndex === steps.length - 1;
  const allStepsDone =
    hasSteps && steps.every((_, i) => completedSteps.has(i));
  const showMarkCompleteInBar = !hasSteps;

  const editorLanguage = isWebLesson
    ? toMonacoLanguage(activeFile)
    : toMonacoLanguage(lesson.language);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <LessonSidebar
        courseSlug={course.slug}
        lessons={course.lessons}
        completedLessons={progress?.completedLessons ?? []}
        currentLessonId={lesson._id}
      />

      <PanelGroup direction="horizontal" className="h-full flex-1">
        <Panel defaultSize={35} minSize={20}>
          <div className="h-full overflow-auto bg-bg p-6">
            <Link
              to={`/courses/${course.slug}`}
              className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
            >
              <ArrowLeft size={14} /> {course.title}
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-surface-tertiary px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                Lesson {lesson.order}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
                  <CheckCircle2 size={14} /> Completed
                </span>
              )}
              {hasSteps && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-text-primary">
              {lesson.title}
            </h1>

            {hasSteps && currentStep ? (
              <>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {steps.map((s, i) => {
                    const done = completedSteps.has(i);
                    const active = i === currentStepIndex;
                    const locked = !done && i > currentStepIndex;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={locked}
                        onClick={() => {
                          if (locked) return;
                          if (i === currentStepIndex) return;
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                          done
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                            : active
                              ? 'bg-brand-500 text-white'
                              : locked
                                ? 'cursor-not-allowed bg-surface-tertiary text-text-muted opacity-60'
                                : 'bg-surface-tertiary text-text-secondary'
                        )}
                        title={s.title}
                      >
                        {done ? (
                          <CheckCircle2 size={11} />
                        ) : locked ? (
                          <Lock size={11} />
                        ) : null}
                        Step {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
                    Step {currentStepIndex + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-text-primary">
                    {currentStep.title}
                  </h2>
                  <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-sm text-text-secondary">
                    {currentStep.instructions}
                  </div>
                  {currentStep.hint && (
                    <details className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                      <summary className="cursor-pointer font-semibold text-text-secondary">
                        Hint
                      </summary>
                      <p className="mt-1 whitespace-pre-wrap text-text-muted">
                        {currentStep.hint}
                      </p>
                    </details>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => void handleNextStep()}
                    disabled={!accepted || savingStep}
                  >
                    {savingStep
                      ? 'Saving…'
                      : isLastStep
                        ? 'Finish lesson'
                        : 'Next step'}
                  </Button>
                  {!accepted && (
                    <p className="text-xs text-text-muted">
                      Submit your code to unlock the next step.
                    </p>
                  )}
                  {!user && accepted && (
                    <p className="text-xs text-text-muted">
                      Sign in to save your step progress.
                    </p>
                  )}
                </div>

                {allStepsDone && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/5 px-3 py-2 text-xs font-medium text-[var(--color-success)]">
                    <CheckCircle2 size={14} /> All steps complete
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-sm text-text-secondary">
                  {lesson.content}
                </div>

                {hasTests && lesson.outputMode === 'return' && (
                  <p className="mt-4 text-xs text-text-muted">
                    Implement the function{' '}
                    <code className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-text-primary">
                      {lesson.functionName}
                    </code>{' '}
                    - return the result; the platform compares it to the expected
                    output automatically.
                  </p>
                )}

                {testCases.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Test Cases
                    </h3>
                    <div className="mt-2 flex flex-col gap-2">
                      {testCases.map((tc, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-surface p-3 text-xs"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-secondary">
                              Test {i + 1}
                            </span>
                            {tc.isHidden && (
                              <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                                hidden
                              </span>
                            )}
                          </div>
                          {!tc.isHidden && (
                            <>
                              {tc.input && (
                                <>
                                  <div className="text-text-muted">Input</div>
                                  <code className="mt-0.5 block break-all font-mono text-text-primary">
                                    {tc.input}
                                  </code>
                                </>
                              )}
                              <div className="mt-2 text-text-muted">Expected</div>
                              <code className="mt-0.5 block font-mono text-text-primary">
                                {tc.expectedOutput}
                              </code>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!user && (
                  <p className="mt-6 text-xs text-text-muted">
                    <Link to="/login" className="text-brand-500 hover:underline">
                      Log in
                    </Link>{' '}
                    to save your progress. The Mark as Complete button lives
                    next to Run in the toolbar.
                  </p>
                )}
              </>
            )}

            {lesson.problemSlug && (
              <Link
                to={`/practice/${lesson.problemSlug}`}
                className="mt-4 inline-flex items-center rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-500/20"
              >
                Practice the related coding problem
              </Link>
            )}

            <CourseQuiz courseSlug={course.slug} lessonSlug={lesson.slug} />

            {progress && (
              <div className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
                Course progress:{' '}
                <strong className="text-brand-500">{progress.percentage}%</strong>
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        <Panel defaultSize={65}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65}>
              <div className="flex h-full flex-col bg-surface">
                <RunBar
                  left={
                    isWebLesson ? (
                      <div className="flex gap-1">
                        {WEB_FILES.map((fileName) => (
                          <button
                            key={fileName}
                            type="button"
                            onClick={() => setActiveFile(fileName)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                              activeFile === fileName
                                ? 'bg-surface-tertiary text-brand-500'
                                : 'text-text-muted hover:bg-surface-tertiary hover:text-text-primary'
                            }`}
                          >
                            {fileName}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                        {getFileName(lesson.language)}
                      </span>
                    )
                  }
                  onRun={handleRunCode}
                  running={running}
                  onSubmit={isWebLesson ? handleSubmitWeb : undefined}
                  submitting={submitting}
                  hideSubmit={!isWebLesson}
                  onMarkComplete={
                    showMarkCompleteInBar
                      ? () => void markComplete()
                      : undefined
                  }
                  markCompleteDisabled={
                    !user || !canComplete || completing || isCompleted
                  }
                  markCompleteBusy={completing}
                  completed={isCompleted}
                />
                <div className="flex-1">
                  <CodeEditor
                    language={editorLanguage}
                    value={activeCode}
                    onChange={(value) => {
                      if (isWebLesson) {
                        handleFileChange(activeFile, value);
                      } else {
                        setCode(value);
                      }
                    }}
                    projectFiles={isWebLesson ? files : undefined}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="h-1 bg-border transition-colors hover:bg-brand-500" />

            <Panel defaultSize={35}>
              {isWebLesson ? (
                <div className="flex h-full flex-col bg-surface-secondary">
                  <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Live preview
                  </div>
                  <div className="flex-1 bg-white">
                    {webPreview ? (
                      <iframe
                        title="Web lesson preview"
                        srcDoc={webPreview}
                        className="h-full w-full border-0"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <div className="grid h-full place-items-center p-6 text-center text-sm text-text-muted">
                        Start typing to see a live preview. Submit to check your
                        work.
                      </div>
                    )}
                  </div>
                  {webMessage && (
                    <p
                      className={`border-t border-border px-4 py-2 text-xs ${
                        accepted
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-error)]'
                      }`}
                    >
                      {webMessage}
                    </p>
                  )}
                </div>
              ) : (
                <TestPanel
                  testCases={testCases}
                  results={summary?.results}
                  running={running}
                  accepted={accepted}
                  totalRuntimeMs={totalRuntimeMs}
                />
              )}
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

function getFileName(lang: string): string {
  switch (lang) {
    case 'html-css':
      return 'index.html';
    case 'javascript':
    case 'dsa-javascript':
      return 'script.js';
    case 'typescript':
      return 'script.ts';
    case 'python':
    case 'dsa-python':
      return 'main.py';
    case 'ruby':
      return 'main.rb';
    case 'java':
      return 'Main.java';
    case 'sql':
      return 'query.sql';
    case 'react':
      return 'App.jsx';
    case 'tailwind':
      return 'index.html';
    default:
      return 'file.txt';
  }
}

function isWebLessonLanguage(lang: string): boolean {
  return lang === 'html-css' || lang === 'react' || lang === 'tailwind';
}

function lessonLanguage(lang: string | undefined): string {
  return lang ?? '';
}

function validateWebFiles(
  files: Record<string, string>,
  checks?: { requiredHtml: string[]; requiredCss: string[]; requiredJs: string[] }
): { ok: boolean; message: string } {
  const html = files['index.html']?.trim() ?? '';
  const css = files['styles.css']?.trim() ?? '';
  const javascript = files['script.js']?.trim() ?? '';
  if (!html) return { ok: false, message: 'index.html is empty.' };
  if ((css.match(/{/g) ?? []).length !== (css.match(/}/g) ?? []).length) {
    return { ok: false, message: 'styles.css has an unmatched brace.' };
  }
  try {
    new Function(javascript);
  } catch (error) {
    return {
      ok: false,
      message: `script.js has a syntax error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  if (parsed.querySelector('parsererror')) {
    return { ok: false, message: 'index.html could not be parsed.' };
  }
  const missingHtml = (checks?.requiredHtml ?? []).find((token) => !html.includes(token));
  if (missingHtml) return { ok: false, message: `HTML check failed: missing "${missingHtml}".` };
  const missingCss = (checks?.requiredCss ?? []).find((token) => !css.includes(token));
  if (missingCss) return { ok: false, message: `CSS check failed: missing "${missingCss}".` };
  const missingJs = (checks?.requiredJs ?? []).find((token) => !javascript.includes(token));
  if (missingJs) return { ok: false, message: `JavaScript check failed: missing "${missingJs}".` };
  return { ok: true, message: 'All checks passed.' };
}