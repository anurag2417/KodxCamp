import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useLesson } from '../hooks/useLesson';
import { useAuthStore } from '../store/auth.store';
import { progressApi, type ApiProgress } from '../lib/progress.api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CodeEditor } from '../components/editor/CodeEditor';
import { Console } from '../components/editor/Console';
import { RunBar } from '../components/editor/RunBar';
import { LessonSidebar } from '../components/course/LessonSidebar';
import { runTests } from '../lib/runner/testHarness';

export const Lesson: React.FC = () => {
  const { courseSlug, lessonSlug } = useParams<{
    courseSlug: string;
    lessonSlug: string;
  }>();
  const { data, loading, error } = useLesson(courseSlug, lessonSlug);
  const user = useAuthStore((s) => s.user);

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>(
    'idle'
  );
  const [progress, setProgress] = useState<ApiProgress | null>(null);
  const [completing, setCompleting] = useState(false);
  const [testsPassed, setTestsPassed] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);

  // Initialize code from lesson starter
  useEffect(() => {
    if (data?.lesson) {
      setCode(data.lesson.starterCode || '');
      setOutput('');
      setStatus('idle');
      setTestsPassed(null);
    }
  }, [data?.lesson]);

  // Load progress
  useEffect(() => {
    if (!user || !data?.course) return;
    progressApi.getForCourse(data.course._id).then(setProgress).catch(() => {});
  }, [user, data?.course]);

  const handleRunCode = async () => {
    if (!data) return;
    setRunning(true);
    setStatus('running');
    setOutput('Running tests...');
    setTestsPassed(null);

    const testCases = (data.lesson.testCases ?? []).map((tc, i) => ({
      index: i,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

    // Lessons default to "print" output mode if the field isn't set
    const outputMode = data.lesson.outputMode ?? 'print';
    const functionName = data.lesson.functionName ?? 'solve';

    const summary = await runTests(
      data.lesson.language,
      code,
      testCases,
      { functionName, outputMode }
    );

    const summaryLine = summary.allPassed
      ? `✅ All ${summary.totalTests} test${
          summary.totalTests === 1 ? '' : 's'
        } passed (${summary.totalRuntimeMs}ms).`
      : `❌ ${summary.passedTests}/${summary.totalTests} tests passed.`;

    const failures = summary.results
      .filter((r) => !r.passed)
      .slice(0, 3)
      .map((r) => {
        const detail = r.stderr
          ? `\n  Error: ${r.stderr}`
          : r.actualOutput !== undefined
            ? `\n  Got: ${r.actualOutput || '(no output)'}`
            : '';
        return `Test #${r.index + 1} — Failed${detail}`;
      })
      .join('\n');

    setOutput(summaryLine + (failures ? `\n\n${failures}` : ''));
    setStatus(summary.allPassed ? 'success' : 'error');
    setTestsPassed(summary.allPassed);
    setRunning(false);
  };

  const markComplete = async () => {
    if (!user) {
      setOutput('Please log in to save your progress.');
      return;
    }
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
  const hasTests = (lesson.testCases ?? []).length > 0;
  const canComplete = !hasTests || testsPassed === true;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      {/* Sidebar of lessons */}
      <LessonSidebar
        courseSlug={course.slug}
        lessons={(course as typeof course & { lessons: typeof lesson[] }).lessons}
        completedLessons={progress?.completedLessons ?? []}
        currentLessonId={lesson._id}
      />

      {/* Main workspace */}
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
            {hasTests && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-text-primary">
                  Test Cases
                </h3>
                <div className="mt-2 flex flex-col gap-2">
                  {lesson.testCases.map((tc, i) => (
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

            {/* Complete button */}
            <div className="mt-6">
              <Button
                variant={isCompleted ? 'secondary' : 'primary'}
                onClick={markComplete}
                disabled={
                  completing ||
                  isCompleted ||
                  !user ||
                  (hasTests && !isCompleted && testsPassed !== true)
                }
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
              {hasTests && !isCompleted && testsPassed !== true && (
                <p className="mt-2 text-xs text-text-muted">
                  Run the code and pass the tests to unlock this.
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

        {/* Editor + Console */}
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
              <Console output={output} status={status} />
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