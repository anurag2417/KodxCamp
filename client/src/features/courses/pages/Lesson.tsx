import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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
  combineSummaries,
  type AnyTestResult,
  type TestRunSummary,
  type VisibleTestCase,
} from '@/shared/runner/testHarness';
import {
  runHiddenTests,
  type HiddenTestCase,
  type HiddenTestOutcome,
} from '@/shared/runner/hiddenHarness';
import { TestPanel } from '@/features/problems/components/TestPanel';

export const Lesson: React.FC = () => {
  const { courseSlug, lessonSlug } = useParams<{
    courseSlug: string;
    lessonSlug: string;
  }>();
  const { data, loading, error } = useLesson(courseSlug, lessonSlug);
  const user = useAuthStore((s) => s.user);

  const [code, setCode] = useState('');
  const [results, setResults] = useState<AnyTestResult[]>();
  const [accepted, setAccepted] = useState(false);
  const [totalRuntimeMs, setTotalRuntimeMs] = useState(0);
  const [progress, setProgress] = useState<ApiProgress | null>(null);
  const [completing, setCompleting] = useState(false);
  const [running, setRunning] = useState(false);

  // Initialize code from lesson starter
  useEffect(() => {
    if (data?.lesson) {
      setCode(data.lesson.starterCode || '');
      setResults(undefined);
      setAccepted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.lesson?._id]);

  // Load progress
  useEffect(() => {
    if (!user || !data?.course) return;
    progressApi
      .getForCourse(data.course._id)
      .then(setProgress)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, data?.course?._id]);

  const visibleTestCases = useMemo(
    () => data?.lesson.testCases ?? [],
    [data?.lesson]
  );
  const hiddenTestCases = useMemo(
    () => data?.lesson.hiddenTestCases ?? [],
    [data?.lesson]
  );
  const hasTests = visibleTestCases.length > 0 || hiddenTestCases.length > 0;

  const handleRunCode = async () => {
    if (!data) return;
    setRunning(true);
    setResults(undefined);
    setAccepted(false);

    const visibleCases: VisibleTestCase[] = visibleTestCases.map((tc) => ({
      index: tc.index,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

    const visibleSummary: TestRunSummary = await runTests(
      data.lesson.language,
      code,
      visibleCases,
      {
        functionName: data.lesson.functionName ?? 'solve',
        outputMode: data.lesson.outputMode ?? 'print',
      }
    );

    let hiddenSummary: {
      results: AnyTestResult[];
      totalRuntimeMs: number;
    } = { results: [], totalRuntimeMs: 0 };

    if (hiddenTestCases.length > 0) {
      const hiddenInputs: HiddenTestCase[] = hiddenTestCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutputHash: tc.expectedOutputHash,
        canonicalization: tc.canonicalization,
      }));

      const started = performance.now();
      const outcomes: HiddenTestOutcome[] = await runHiddenTests(
        data.lesson.language,
        code,
        hiddenInputs,
        {
          functionName: data.lesson.functionName ?? 'solve',
          outputMode: data.lesson.outputMode ?? 'print',
          timeoutMs: 10000,
        }
      );

      hiddenSummary = {
        results: outcomes.map((o) => ({
          kind: 'hidden' as const,
          id: o.id,
          passed: o.passed,
          runtimeMs: 0,
        })),
        totalRuntimeMs: Math.round(performance.now() - started),
      };
    }

    const combined = combineSummaries(visibleSummary, hiddenSummary);
    setResults(combined.results);
    setAccepted(combined.allPassed);
    setTotalRuntimeMs(combined.totalRuntimeMs);
    setRunning(false);
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
  const canComplete = !hasTests || accepted;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <LessonSidebar
        courseSlug={course.slug}
        lessons={(course as typeof course & { lessons: typeof lesson[] }).lessons}
        completedLessons={progress?.completedLessons ?? []}
        currentLessonId={lesson._id}
      />

      <PanelGroup direction="horizontal" className="h-full flex-1">
        {/* Instructions */}
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
            </div>

            <h1 className="mt-3 text-2xl font-bold text-text-primary">
              {lesson.title}
            </h1>

            <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-sm text-text-secondary">
              {lesson.content}
            </div>

            {/* Implementation hint */}
            {hasTests && lesson.outputMode === 'return' && (
              <p className="mt-4 text-xs text-text-muted">
                Implement the function{' '}
                <code className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-text-primary">
                  {lesson.functionName}
                </code>{' '}
                — return the result; the platform compares it to the expected
                output automatically.
              </p>
            )}

            {/* Visible test cases */}
            {visibleTestCases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-text-primary">
                  Visible Test Cases
                </h3>
                <div className="mt-2 flex flex-col gap-2">
                  {visibleTestCases.map((tc, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-surface p-3 text-xs"
                    >
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hiddenTestCases.length > 0 && (
              <p className="mt-4 rounded-lg border border-border bg-surface-secondary p-3 text-xs text-text-muted">
                🔒 This lesson also has {hiddenTestCases.length} hidden test
                {hiddenTestCases.length === 1 ? '' : 's'}. They run when you
                click Run, but their inputs and expected outputs are not shown.
              </p>
            )}

            {/* Complete button */}
            <div className="mt-6">
              <Button
                variant={isCompleted ? 'secondary' : 'primary'}
                onClick={markComplete}
                disabled={completing || isCompleted || !user || !canComplete}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 size={16} /> Completed
                  </>
                ) : completing ? (
                  'Saving...'
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Mark as Complete
                  </>
                )}
              </Button>
              {hasTests && !isCompleted && !accepted && (
                <p className="mt-2 text-xs text-text-muted">
                  Run the code and pass all tests to unlock this.
                </p>
              )}
              {!user && (
                <p className="mt-2 text-xs text-text-muted">
                  <Link to="/login" className="text-brand-500 hover:underline">
                    Log in
                  </Link>{' '}
                  to save progress
                </p>
              )}
            </div>

            {progress && (
              <div className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
                Course progress:{' '}
                <strong className="text-brand-500">{progress.percentage}%</strong>
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        {/* Editor + TestPanel */}
        <Panel defaultSize={65}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65}>
              <div className="flex h-full flex-col bg-surface">
                <RunBar
                  left={
                    <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                      {getFileName(lesson.language)}
                    </span>
                  }
                  onRun={handleRunCode}
                  running={running}
                />
                <div className="flex-1">
                  <CodeEditor
                    language={toMonacoLanguage(lesson.language)}
                    value={code}
                    onChange={setCode}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="h-1 bg-border transition-colors hover:bg-brand-500" />

            <Panel defaultSize={35}>
              <TestPanel
                testCases={visibleTestCases}
                hiddenCount={hiddenTestCases.length}
                results={results}
                running={running}
                accepted={accepted}
                totalRuntimeMs={totalRuntimeMs}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

function toMonacoLanguage(lang: string): string {
  switch (lang) {
    case 'html-css':
      return 'html';
    case 'javascript':
    case 'dsa-javascript':
      return 'javascript';
    case 'typescript':
      return 'typescript';
    case 'python':
    case 'dsa-python':
      return 'python';
    case 'sql':
      return 'sql';
    case 'react':
      return 'javascript';
    case 'tailwind':
      return 'html';
    default:
      return 'plaintext';
  }
}

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