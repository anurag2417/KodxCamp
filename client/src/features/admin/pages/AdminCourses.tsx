import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, IndianRupee, Gift } from 'lucide-react';
import { adminApi, type AdminCourse } from '@/features/admin/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { AdminTable } from '@/features/admin/components/AdminTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/shared/hooks/useToast';

const LANGUAGES = [
  'html-css',
  'javascript',
  'typescript',
  'python',
  'ruby',
  'java',
  'sql',
  'react',
  'tailwind',
  'dsa-python',
  'dsa-javascript',
];

export const AdminCourses: React.FC = () => {
  const toast = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<AdminCourse | null>(null);
  const [pricing, setPricing] = useState<AdminCourse | null>(null);
  const [busy, setBusy] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');

  // Pricing form state
  const [pricingIsFree, setPricingIsFree] = useState(true);
  const [pricingRupees, setPricingRupees] = useState('499');
  const [pricingBusy, setPricingBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listCourses();
      setCourses(data);
    } catch {
      toast.error('Could not load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setLanguage(LANGUAGES[0]);
    setPublished(false);
    setError('');
  };

  const autoSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleCreate = async () => {
    setError('');
    if (!title || title.length < 2) return setError('Title is too short');
    if (!slug || slug.length < 2) return setError('Slug is too short');
    if (!/^[a-z0-9-]+$/.test(slug)) return setError('Invalid slug');
    if (!description || description.length < 5)
      return setError('Description is too short');

    setBusy(true);
    try {
      const created = await adminApi.createCourse({
        title,
        slug,
        description,
        language,
        published,
      });
      setCourses((prev) => [created, ...prev]);
      resetForm();
      setShowForm(false);
      toast.success(`Created "${created.title}"`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not create course';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (course: AdminCourse) => {
    try {
      const updated = await adminApi.updateCourse(course.slug, {
        published: !course.published,
      });
      setCourses((prev) =>
        prev.map((c) => (c._id === course._id ? updated : c))
      );
    } catch {
      toast.error('Could not update publish state');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await adminApi.deleteCourse(deleting.slug);
      setCourses((prev) => prev.filter((c) => c._id !== deleting._id));
      toast.success('Course deleted');
    } catch {
      toast.error('Could not delete course');
    } finally {
      setDeleting(null);
    }
  };

  const openPricing = (course: AdminCourse) => {
    setPricing(course);
    setPricingIsFree(course.isFree);
    setPricingRupees(
      course.price ? String(Math.round(course.price / 100)) : '499'
    );
  };

  const savePricing = async () => {
    if (!pricing) return;

    let pricePaise: number | undefined;
    if (!pricingIsFree) {
      const rupees = Number(pricingRupees);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        toast.error('Enter a valid price greater than 0.');
        return;
      }
      pricePaise = Math.round(rupees * 100);
    }

    setPricingBusy(true);
    try {
      const updated = await adminApi.setCoursePricing(pricing.slug, {
        isFree: pricingIsFree,
        price: pricePaise,
      });
      setCourses((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c))
      );
      toast.success(
        pricingIsFree
          ? `"${updated.title}" is now free`
          : `"${updated.title}" price set to ₹${Math.round((updated.price ?? 0) / 100)}`
      );
      setPricing(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update pricing'
      );
    } finally {
      setPricingBusy(false);
    }
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Courses</h1>
          <p className="mt-1 text-sm text-text-muted">
            Create, price, publish, and delete courses. Lessons are edited in
            the{' '}
            <Link to="/instructor" className="text-brand-500 hover:underline">
              instructor panel
            </Link>
            .
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm((v) => !v);
            if (showForm) resetForm();
          }}
        >
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
            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Publish immediately
            </label>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            New courses start as <strong>free</strong>. You can change pricing
            from the course row after creation.
          </p>
          {error && (
            <p className="mt-2 text-xs text-[var(--color-error)]">{error}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busy}>
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </Card>
      )}

      {pricing && (
        <Card className="mb-6 p-6">
          <h2 className="mb-1 text-sm font-semibold text-text-primary">
            Pricing for "{pricing.title}"
          </h2>
          <p className="mb-4 text-xs text-text-muted">
            Admin-only. Setting a course free hides the buy button and lets any
            logged-in user enroll instantly.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPricingIsFree(true)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                pricingIsFree
                  ? 'border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              <Gift size={14} /> Free
            </button>
            <button
              type="button"
              onClick={() => setPricingIsFree(false)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                !pricingIsFree
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              <IndianRupee size={14} /> Paid
            </button>

            {!pricingIsFree && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">₹</span>
                <input
                  type="number"
                  min={1}
                  value={pricingRupees}
                  onChange={(e) => setPricingRupees(e.target.value)}
                  className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-500 focus:outline-none"
                />
                <span className="text-xs text-text-muted">
                  (whole rupees)
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPricing(null)}>
              Cancel
            </Button>
            <Button onClick={savePricing} disabled={pricingBusy}>
              {pricingBusy ? 'Saving…' : 'Save pricing'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <AdminTable
          headers={['Title', 'Language', 'Lessons', 'Price', 'Status', 'Actions']}
        >
          {courses.map((c) => (
            <tr key={c._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{c.title}</p>
                <p className="text-xs text-text-muted">/courses/{c.slug}</p>
              </td>
              <td className="px-4 py-3 text-text-secondary">{c.language}</td>
              <td className="px-4 py-3 text-text-secondary">
                {c.totalLessons}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => openPricing(c)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    c.isFree
                      ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20'
                      : 'bg-brand-500/10 text-brand-500 hover:bg-brand-500/20'
                  }`}
                  title="Change pricing"
                >
                  {c.isFree ? (
                    <>
                      <Gift size={11} /> Free
                    </>
                  ) : (
                    <>
                      <IndianRupee size={11} /> ₹
                      {Math.round((c.price ?? 0) / 100)}
                    </>
                  )}
                </button>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => togglePublished(c)}
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    c.published
                      ? 'text-[var(--color-success)]'
                      : 'text-text-muted'
                  }`}
                  title={c.published ? 'Published' : 'Draft'}
                >
                  {c.published ? <Eye size={12} /> : <EyeOff size={12} />}
                  {c.published ? 'Live' : 'Draft'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Link to={`/instructor/courses/${c.slug}`}>
                    <Button size="sm" variant="ghost" title="Manage lessons">
                      <Edit size={14} /> Manage
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
              <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                No courses yet. Create the first one.
              </td>
            </tr>
          )}
        </AdminTable>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete course?"
        message={`This will permanently delete "${deleting?.title}" and all its lessons, progress, and team memberships.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};