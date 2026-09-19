import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';
import { adminApi, type AdminLesson } from '../../lib/admin.api';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import {
  TestCaseEditor,
  type EditableTestCase,
} from '../../components/admin/TestCaseEditor';

interface CourseData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  lessons: AdminLesson[];
}

interface LessonEditorState {
  title: string;
  slug: string;
  order: number;
  content: string;
  starterCode: string;
  solution: string;
  testCases: EditableTestCase[];
}

const emptyLesson = (order: number): LessonEditorState => ({
  title: '',
  slug: '',
  order,
  content: '',
  starterCode: '',
  solution: '',
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

export const AdminCourseEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState<LessonEditorState | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminLesson | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError('');
    try {
      // Admin endpoint — returns full lesson docs including solution + testCases
      const { data } = await api.get(`/admin/courses/${slug}`);
      setCourse(data.data);
    } catch (err) {
      setLoadError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [slug]);

  const autoSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const openCreate = () => {
    const nextOrder =
      (course?.lessons.reduce((max, l) => Math.max(max, l.order), 0) ?? 0) + 1;
    setEditing(emptyLesson(nextOrder));
    setOriginalSlug(null);
    setError('');
  };

  const openEdit = (lesson: AdminLesson) => {
    setEditing({
      title: lesson.title,
      slug: lesson.slug,
      order: lesson.order,
      content: lesson.content,
      starterCode: lesson.starterCode ?? '',
      solution: lesson.solution ?? '',
      testCases: (lesson.testCases ?? []).map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      })),
    });
    setOriginalSlug(lesson.slug);
    setError('');
  };

  const closeEditor = () => {
    setEditing(null);
    setOriginalSlug(null);
    setError('');
  };

  const handleSave = async () => {
    if (!course || !editing) return;
    setBusy(true);
    setError('');

    // Pre-validation
    const issues: string[] = [];
    if (!editing.title || editing.title.length < 2) {
      issues.push('Title must be at least 2 characters');
    }
    if (!editing.slug || editing.slug.length < 2) {
      issues.push('Slug must be at least 2 characters');
    }
    if (!/^[a-z0-9-]+$/.test(editing.slug)) {
      issues.push('Slug can only contain lowercase letters, numbers, and dashes');
    }
    if (!editing.content || editing.content.length < 1) {
      issues.push('Content is required');
    }
    if (!editing.order || editing.order < 1) {
      issues.push('Order must be at least 1');
    }
    const emptyExpected = editing.testCases.findIndex(
      (tc) => !tc.expectedOutput || tc.expectedOutput.length === 0
    );
    if (emptyExpected !== -1) {
      issues.push(
        `Test #${emptyExpected + 1} is missing its expected output`
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
      solution: editing.solution,
      language: course.language,
      testCases: editing.testCases,
    };

    try {
      if (originalSlug) {
        await adminApi.updateLesson(course.slug, originalSlug, payload);
      } else {
        await adminApi.createLesson(course.slug, payload);
      }

      await reload();
      closeEditor();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!course || !deleting) return;
    try {
      await adminApi.deleteLesson(course.slug, deleting.slug);
      await reload();
      setDeleting(null);
    } catch (err) {
      setError(extractError(err));
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="w-full p-8">
        <p className="text-[var(--color-error)]">
          {loadError || 'Course not found'}
        </p>
        <Link
          to="/admin/courses"
          className="mt-4 inline-block text-brand-500 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/admin/courses"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> All Courses
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {course.title}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {course.lessons.length}{' '}
            {course.lessons.length === 1 ? 'lesson' : 'lessons'} ·{' '}
            {course.language}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Lesson
        </Button>
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
            onChange={(e) =>
              setEditing({ ...editing, content: e.target.value })
            }
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
          />

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <textarea
              placeholder="Starter code"
              rows={6}
              value={editing.starterCode}
              onChange={(e) =>
                setEditing({ ...editing, starterCode: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
            />
            <textarea
              placeholder="Solution (hidden from students)"
              rows={6}
              value={editing.solution}
              onChange={(e) =>
                setEditing({ ...editing, solution: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
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
            <Button onClick={handleSave} disabled={busy}>
              <Save size={14} /> {busy ? 'Saving...' : 'Save Lesson'}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {course.lessons.map((l) => (
          <Card
            key={l._id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded bg-surface-tertiary text-xs font-bold text-brand-500">
                  {l.order}
                </span>
                <p className="text-sm font-medium text-text-primary">
                  {l.title}
                </p>
              </div>
              <p className="mt-1 truncate text-xs text-text-muted">
                {l.slug}
              </p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(l)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleting(l)}
                title="Delete"
              >
                <Trash2 size={14} className="text-[var(--color-error)]" />
              </Button>
            </div>
          </Card>
        ))}

        {course.lessons.length === 0 && (
          <Card className="p-8 text-center text-sm text-text-muted">
            No lessons yet. Add the first one above.
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete lesson?"
        message={`This will permanently delete "${deleting?.title}".`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};