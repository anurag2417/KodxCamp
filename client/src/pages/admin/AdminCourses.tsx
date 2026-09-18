import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { adminApi, type AdminCourse } from '../../lib/admin.api';
import { coursesApi } from '../../lib/courses.api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AdminTable } from '../../components/admin/AdminTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

const LANGUAGES = [
  'html-css',
  'javascript',
  'typescript',
  'python',
  'sql',
  'react',
  'tailwind',
  'dsa-python',
  'dsa-javascript',
];

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<AdminCourse | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      // Public catalog returns everything the admin table needs.
      const data = await coursesApi.list();
      setCourses(data.map((course) => ({ ...course, createdAt: '' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleCreate = async () => {
    setError('');
    try {
      const created = await adminApi.createCourse({
        title,
        slug,
        description,
        language,
      });
      setCourses((prev) => [...prev, created]);
      setShowForm(false);
      setTitle('');
      setSlug('');
      setDescription('');
    } catch {
      setError('Could not create course');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await adminApi.deleteCourse(deleting.slug);
    setCourses((prev) => prev.filter((c) => c._id !== deleting._id));
    setDeleting(null);
  };

  const autoSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Courses</h1>
          <p className="mt-1 text-sm text-text-muted">Manage courses and lessons.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> {showForm ? 'Close' : 'New Course'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Create a course
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(autoSlug(e.target.value));
              }}
            />
            <Input
              placeholder="Slug"
              value={slug}
              onChange={(e) => setSlug(autoSlug(e.target.value))}
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="md:col-span-2"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="mt-2 text-xs text-[var(--color-error)]">{error}</p>}
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <AdminTable headers={['Title', 'Language', 'Lessons', 'Actions']}>
          {courses.map((c) => (
            <tr key={c._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{c.title}</p>
                <p className="text-xs text-text-muted">/courses/{c.slug}</p>
              </td>
              <td className="px-4 py-3 text-text-secondary">{c.language}</td>
              <td className="px-4 py-3 text-text-secondary">{c.totalLessons}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Link to={`/admin/courses/${c.slug}`}>
                    <Button size="sm" variant="ghost" title="Edit lessons">
                      <Edit size={14} /> Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(c)}
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-[var(--color-error)]" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {courses.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-text-muted">
                No courses yet.
              </td>
            </tr>
          )}
        </AdminTable>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete course?"
        message={`This will permanently delete "${deleting?.title}" and all its lessons.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};