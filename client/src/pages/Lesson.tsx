import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Play } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useLesson } from '../hooks/useLesson';
import { useAuthStore } from '../store/auth.store';
import { progressApi, type ApiProgress } from '../lib/progress.api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CodeEditor } from '../components/editor/CodeEditor';
import { Console } from '../components/editor/Console';
import { LessonSidebar } from '../components/course/LessonSidebar';
import { runCode } from '../lib/runner';

export const Lesson: React.FC = () => {
    const { courseSlug, lessonSlug } = useParams<{
        courseSlug: string;
        lessonSlug: string;
    }>();
    const { data, loading, error } = useLesson(courseSlug, lessonSlug);
    const user = useAuthStore((s) => s.user);

    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState<ApiProgress | null>(null);
    const [completing, setCompleting] = useState(false);

    // Initialize code from lesson starter
    useEffect(() => {
        if (data?.lesson) {
            setCode(data.lesson.starterCode || '');
            setOutput('');
            setStatus('idle');
        }
    }, [data?.lesson]);

    // Load progress
    useEffect(() => {
        if (!user || !data?.course) return;
        progressApi.getForCourse(data.course._id).then(setProgress).catch(() => { });
    }, [user, data?.course]);

    const handleRunCode = async () => {
        if (!data) return;
        setStatus('running');
        setOutput('');
        const result = await runCode(data.lesson.language, code, { timeoutMs: 5000 });
        const combined =
            result.stdout + (result.stderr ? `\n${result.stderr}` : '') || '(no output)';
        setOutput(combined);
        setStatus(result.ok ? 'success' : 'error');
    };

    const markComplete = async () => {
        if (!user) {
            setOutput('Please log in to save your progress.');
            return;
        }
        if (!data?.course || !data?.lesson) return;
        setCompleting(true);
        try {
            const updated = await progressApi.markComplete(data.course._id, data.lesson._id);
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
                <Link to="/courses" className="mt-4 inline-block text-brand-500 hover:underline">
                    ← Back to courses
                </Link>
            </div>
        );
    }

    const { course, lesson } = data;
    const isCompleted = progress?.completedLessons.includes(lesson._id) ?? false;

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

                        <h1 className="mt-3 text-2xl font-bold text-text-primary">{lesson.title}</h1>

                        <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-sm text-text-secondary">
                            {lesson.content}
                        </div>

                        {/* Visible test cases */}
                        {lesson.testCases.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-text-primary">Test Cases</h3>
                                <div className="mt-2 flex flex-col gap-2">
                                    {lesson.testCases.map((tc, i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-border bg-surface p-3 text-xs"
                                        >
                                            <div className="text-text-muted">Expected</div>
                                            <code className="mt-1 block font-mono text-text-primary">
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
                                disabled={completing || isCompleted || !user}
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
                                Course progress: <strong className="text-brand-500">{progress.percentage}%</strong>
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
                                <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-2">
                                    <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                                        {getFileName(lesson.language)}
                                    </span>
                                    <Button size="sm" onClick={handleRunCode} disabled={status === 'running'}>
                                        <Play size={14} />
                                        {status === 'running' ? 'Running...' : 'Run Code'}
                                    </Button>
                                </div>
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