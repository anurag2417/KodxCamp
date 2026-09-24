import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Eye,
    EyeOff,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
    instructorApi,
    type ApiInstructorCourseFull,
    type ApiInstructorLesson,
} from '@/features/instructor/api';
import { queryKeys } from '@/shared/lib/queryKeys';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import {
    TestCaseEditor,
    type EditableTestCase,
} from '@/features/admin/components/TestCaseEditor';

interface LessonEditorState {
    title: string;
    slug: string;
    order: number;
    content: string;
    starterCode: string;
    starterFiles: Record<string, string>;
    solution: string;
    problemSlug: string;
    functionName: string;
    outputMode: 'return' | 'print';
    testCases: EditableTestCase[];
}

const emptyLesson = (order: number): LessonEditorState => ({
    title: '',
    slug: '',
    order,
    content: '',
    starterCode: '',
    starterFiles: {
        'index.html': '',
        'styles.css': '',
        'script.js': '',
    },
    solution: '',
    problemSlug: '',
    functionName: 'solve',
    outputMode: 'print',
    testCases: [],
});

function extractError(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const body = err.response?.data as
            | { message?: string; details?: { path: string; message: string }[] }
            | undefined;
        if (body?.details?.length) {
            return body.details.map((d) => `• ${d.path}: ${d.message}`).join('\n');
        }
        if (body?.message) return body.message;
        return `Request failed (${err.response?.status ?? 'network'})`;
    }
    if (err instanceof Error) return err.message;
    return 'Failed to save';
}

export const InstructorCourseEdit: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.courses.detail(slug ?? ''),
        queryFn: () => instructorApi.getCourseFull(slug!),
        enabled: !!slug,
    });

    const [editing, setEditing] = useState<LessonEditorState | null>(null);
    const [originalSlug, setOriginalSlug] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<{ slug: string; title: string } | null>(
        null
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const course = query.data;

    useEffect(() => {
        if (!course) return;
        document.title = `${course.title} · KodxCamp`;
    }, [course]);

    const refresh = () => {
        qc.invalidateQueries({
            queryKey: queryKeys.courses.detail(slug ?? ''),
        });
        qc.invalidateQueries({ queryKey: queryKeys.courses.all });
    };

    const openCreate = () => {
        const nextOrder =
            (course?.lessons.reduce((max, l) => Math.max(max, l.order), 0) ?? 0) + 1;
        setEditing(emptyLesson(nextOrder));
        setOriginalSlug(null);
        setError('');
    };

    const openEdit = (lesson: ApiInstructorLesson) => {
        // Normalize test cases: hidden tests only store a hash, so we
        // leave their expected output blank. The admin must re-enter it
        // to change the expected answer.
        const normalized: EditableTestCase[] = (lesson.testCases ?? []).map(
            (tc) => ({
                input: tc.input ?? '',
                expectedOutput: tc.isHidden ? '' : tc.expectedOutput ?? '',
                isHidden: tc.isHidden === true,
            })
        );

        setEditing({
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order,
            content: lesson.content,
            starterCode: lesson.starterCode ?? '',
            starterFiles: lesson.starterFiles ?? {
                'index.html': '',
                'styles.css': '',
                'script.js': '',
            },
            solution: lesson.solution ?? '',
            problemSlug: lesson.problemSlug ?? '',
            functionName: lesson.functionName ?? 'solve',
            outputMode: lesson.outputMode ?? 'print',
            testCases: normalized,
        });
        setOriginalSlug(lesson.slug);
        setError('');
    };

    const closeEditor = () => {
        setEditing(null);
        setOriginalSlug(null);
        setError('');
    };

    const handleSaveLesson = async () => {
        if (!course || !editing) return;
        setBusy(true);
        setError('');

        const issues: string[] = [];
        if (!editing.title || editing.title.length < 2) issues.push('Title too short');
        if (!editing.slug || editing.slug.length < 2) issues.push('Slug too short');
        if (!/^[a-z0-9-]+$/.test(editing.slug)) issues.push('Invalid slug');
        if (!editing.content) issues.push('Content required');
        if (!editing.order || editing.order < 1) issues.push('Order must be ≥ 1');
        const emptyExpected = editing.testCases.findIndex(
            (tc) => !tc.expectedOutput
        );
        if (emptyExpected !== -1) {
            issues.push(
                `Test #${emptyExpected + 1} is missing expected output${editing.testCases[emptyExpected].isHidden
                    ? ' (required even for hidden tests)'
                    : ''
                }`
            );
        }

        if (issues.length) {
            setError(issues.map((p) => `• ${p}`).join('\n'));
            setBusy(false);
            return;
        }

        const payload = {
            title: editing.title,
            slug: editing.slug,
            order: editing.order,
            content: editing.content,
            starterCode: editing.starterCode,
            starterFiles: isWebCourse(course.language)
                ? editing.starterFiles
                : undefined,
            solution: editing.solution,
            problemSlug: editing.problemSlug || undefined,
            functionName: editing.functionName,
            outputMode: editing.outputMode,
            language: course.language,
            testCases: editing.testCases.map((tc) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden,
            })),
        };

        try {
            if (originalSlug) {
                await instructorApi.updateLesson(course.slug, originalSlug, payload);
            } else {
                await instructorApi.createLesson(course.slug, payload);
            }
            refresh();
            closeEditor();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteLesson = async () => {
        if (!course || !deleting) return;
        try {
            await instructorApi.deleteLesson(course.slug, deleting.slug);
            refresh();
            setDeleting(null);
        } catch (err) {
            setError(extractError(err));
            setDeleting(null);
        }
    };

    const togglePublish = async () => {
        if (!course) return;
        try {
            await instructorApi.setPublished(course.slug, !course.published);
            refresh();
        } catch (err) {
            setError(extractError(err));
        }
    };

    const deleteCourse = async () => {
        if (!course) return;
        if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
        try {
            await instructorApi.deleteCourse(course.slug);
            qc.invalidateQueries({ queryKey: queryKeys.courses.all });
            navigate('/instructor');
        } catch (err) {
            setError(extractError(err));
        }
    };

    if (query.isLoading) {
        return (
            <div className="flex w-full justify-center py-32">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (query.error || !course) {
        return (
            <div className="w-full p-6 lg:p-8">
                <Link
                    to="/instructor"
                    className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
                >
                    <ArrowLeft size={14} /> My Courses
                </Link>
                <div className="mt-6">
                    <ErrorState
                        title="Couldn't load this course"
                        message="Either it doesn't exist or you don't have access."
                        onRetry={() => query.refetch()}
                    />
                </div>
            </div>
        );
    }

    const { permissions: perms } = course;

    return (
        <div className="w-full p-6 lg:p-8">
            <Link
                to="/instructor"
                className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
            >
                <ArrowLeft size={14} /> My Courses
            </Link>

            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">{course.title}</h1>
                    <p className="mt-1 text-sm text-text-muted">
                        {course.lessons.length} lessons · {course.language} ·{' '}
                        {course.published ? (
                            <span className="text-[var(--color-success)]">Live</span>
                        ) : (
                            <span className="text-[var(--color-warning)]">Draft</span>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {perms.canManageCourse && (
                        <Button variant="secondary" onClick={togglePublish}>
                            {course.published ? (
                                <>
                                    <EyeOff size={14} /> Unpublish
                                </>
                            ) : (
                                <>
                                    <Eye size={14} /> Publish
                                </>
                            )}
                        </Button>
                    )}
                    {perms.canEditContent && (
                        <Button onClick={openCreate}>
                            <Plus size={16} /> Add Lesson
                        </Button>
                    )}
                </div>
            </div>

            {editing && (
                <Card className="mb-6 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-text-primary">
                            {originalSlug ? 'Edit lesson' : 'New lesson'}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={closeEditor}>
                            Cancel
                        </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            placeholder="Title"
                            value={editing.title}
                            onChange={(e) =>
                                setEditing({
                                    ...editing,
                                    title: e.target.value,
                                    slug: originalSlug ? editing.slug : autoSlug(e.target.value),
                                })
                            }
                            className="md:col-span-2"
                        />
                        <Input
                            type="number"
                            min={1}
                            placeholder="Order"
                            value={editing.order}
                            onChange={(e) =>
                                setEditing({ ...editing, order: Number(e.target.value) })
                            }
                        />
                    </div>

                    <Input
                        placeholder="Slug (lowercase, dashes)"
                        value={editing.slug}
                        onChange={(e) =>
                            setEditing({ ...editing, slug: autoSlug(e.target.value) })
                        }
                        className="mt-3"
                    />

                    <textarea
                        placeholder="Content (Markdown supported)"
                        rows={6}
                        value={editing.content}
                        onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                        className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
                    />

                    <Input
                        placeholder="Coding problem slug (optional, e.g. two-sum)"
                        value={editing.problemSlug}
                        onChange={(e) =>
                            setEditing({ ...editing, problemSlug: e.target.value.trim() })
                        }
                        className="mt-3"
                    />

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-text-secondary">
                                Function name
                            </label>
                            <Input
                                placeholder="e.g. sum, double"
                                value={editing.functionName}
                                onChange={(e) =>
                                    setEditing({ ...editing, functionName: e.target.value.trim() })
                                }
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-text-secondary">
                                Output mode
                            </label>
                            <select
                                value={editing.outputMode}
                                onChange={(e) =>
                                    setEditing({
                                        ...editing,
                                        outputMode: e.target.value as 'return' | 'print',
                                    })
                                }
                                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                            >
                                <option value="print">Print to console</option>
                                <option value="return">Return value</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {isWebCourse(course.language) ? (
                            <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
                                {(['index.html', 'styles.css', 'script.js'] as const).map(
                                    (fileName) => (
                                        <textarea
                                            key={fileName}
                                            placeholder={fileName}
                                            rows={8}
                                            value={editing.starterFiles[fileName] ?? ''}
                                            onChange={(e) =>
                                                setEditing({
                                                    ...editing,
                                                    starterFiles: {
                                                        ...editing.starterFiles,
                                                        [fileName]: e.target.value,
                                                    },
                                                })
                                            }
                                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                                        />
                                    )
                                )}
                            </div>
                        ) : (
                            <textarea
                                placeholder="Starter code"
                                rows={6}
                                value={editing.starterCode}
                                onChange={(e) =>
                                    setEditing({ ...editing, starterCode: e.target.value })
                                }
                                className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                            />
                        )}
                        <textarea
                            placeholder="Solution (not shown to students)"
                            rows={6}
                            value={editing.solution}
                            onChange={(e) =>
                                setEditing({ ...editing, solution: e.target.value })
                            }
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                        />
                    </div>

                    <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold text-text-secondary">
                            Test Cases
                        </p>
                        <TestCaseEditor
                            testCases={editing.testCases}
                            onChange={(tcs) => setEditing({ ...editing, testCases: tcs })}
                        />
                    </div>

                    {error && (
                        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-3 text-xs text-[var(--color-error)]">
                            {error}
                        </pre>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="ghost" onClick={closeEditor}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveLesson} disabled={busy}>
                            <Save size={14} /> {busy ? 'Saving...' : 'Save Lesson'}
                        </Button>
                    </div>
                </Card>
            )}

            <div className="flex flex-col gap-2">
                {course.lessons.map((l) => (
                    <Card key={l._id} className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="grid h-6 w-6 place-items-center rounded bg-surface-tertiary text-xs font-bold text-brand-500">
                                    {l.order}
                                </span>
                                <p className="text-sm font-medium text-text-primary">{l.title}</p>
                                {l.testCases.some((tc) => tc.isHidden) && (
                                    <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-500">
                                        hidden tests
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 truncate text-xs text-text-muted">{l.slug}</p>
                        </div>
                        <div className="flex gap-1">
                            {perms.canEditContent && (
                                <>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)}>
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDeleting({ slug: l.slug, title: l.title })}
                                    >
                                        <Trash2 size={14} className="text-[var(--color-error)]" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>
                ))}

                {course.lessons.length === 0 && (
                    <Card className="p-8 text-center text-sm text-text-muted">
                        {perms.canEditContent
                            ? 'No lessons yet. Add the first one above.'
                            : 'No lessons yet.'}
                    </Card>
                )}
            </div>

            {perms.canManageCourse && (
                <div className="mt-8 border-t border-border pt-6">
                    <Button
                        variant="ghost"
                        onClick={deleteCourse}
                        className="text-[var(--color-error)]"
                    >
                        <Trash2 size={14} /> Delete Course
                    </Button>
                </div>
            )}

            <ConfirmDialog
                open={!!deleting}
                title="Delete lesson?"
                message={`This will permanently delete "${deleting?.title}".`}
                confirmLabel="Delete"
                danger
                onConfirm={handleDeleteLesson}
                onCancel={() => setDeleting(null)}
            />
        </div>
    );
};

function autoSlug(val: string) {
    return val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function isWebCourse(language: string): boolean {
    return language === 'html-css' || language === 'react' || language === 'tailwind';
}