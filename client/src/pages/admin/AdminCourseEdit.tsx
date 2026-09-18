import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
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

const emptyLesson = (order: number): Partial<AdminLesson> => ({
  title: '',
  slug: '',
  order,
  content: '',
  starterCode: '',
  solution: '',
  testCases: [],
});

export const AdminCourseEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AdminLesson> | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [testCases, setTestCases] = useState<EditableTestCase[]>([]);

  const reload = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      // ADMIN endpoint — returns full lesson docs (starterCode, solution, testCases)
      const { data } = await api.get(`/admin/courses/${slug}`);
      setCourse(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [slug]);

  const openCreate = () => {
    const order = (course?.lessons.length ?? 0) + 1;
    setEditing(emptyLesson(order));
    setTestCases([]);
    setOriginalSlug(null);
  };

  const openEdit = (lesson: AdminLesson) => {
    setEditing(lesson);
    setTestCases(lesson.testCases ?? []);
    setOriginalSlug(lesson.slug);
  };

  const autoSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

  const handleSave = async () => {
    if (!course || !editing) return;
    setBusy(true);
    try {
      const payload = {
        title: editing.title ?? '',
        slug: editing.slug ?? '',
        order: editing.order ?? 1,
        content: editing.content ?? '',
        starterCode: editing.starterCode ?? '',
        solution: editing.solution ?? '',
        language: course.language,
        testCases,
      };

      if (originalSlug) {
        await adminApi.updateLesson(course.slug, originalSlug, payload);
      } else {
        await adminApi.createLesson(course.slug, payload);
      }

      await reload();
      setEditing(null);
      setTestCases([]);
      setOriginalSlug(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!course || !deleting) return;
    await adminApi.deleteLesson(course.slug, deleting.slug);
    await reload();
    setDeleting(null);
  };

  if (loading || !course) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
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
          <h1 className="text-3xl font-bold text-text-primary">{course.title}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {course.lessons.length} lessons · {course.language}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setTestCases([]);
                setOriginalSlug(null);
              }}
            >
              Cancel
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Title"
              value={editing.title ?? ''}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  title: e.target.value,
                  slug: autoSlug(e.target.value),
                })
              }
            />
            <Input
              placeholder="Slug"
              value={editing.slug ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, slug: autoSlug(e.target.value) })
              }
            />
          </div>

          <textarea
            placeholder="Content (Markdown supported)"
            rows={6}
            value={editing.content ?? ''}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
          />

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <textarea
              placeholder="Starter code"
              rows={5}
              value={editing.starterCode ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, starterCode: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
            />
            <textarea
              placeholder="Solution (hidden from students)"
              rows={5}
              value={editing.solution ?? ''}
              onChange={(e) => setEditing({ ...editing, solution: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-text-secondary">
              Test Cases
            </p>
            <TestCaseEditor testCases={testCases} onChange={setTestCases} />
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={busy}>
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
              </div>
              <p className="mt-1 truncate text-xs text-text-muted">{l.slug}</p>
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
            No lessons yet. Add the first one.
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