import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Map } from 'lucide-react';
import { adminApi } from '@/features/admin/api';
import type { AdminRoadmapSummary } from '@/features/admin/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { AdminTable } from '@/features/admin/components/AdminTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/shared/hooks/useToast';

function formatINR(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export const AdminRoadmaps: React.FC = () => {
  const toast = useToast();
  const [roadmaps, setRoadmaps] = useState<AdminRoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<AdminRoadmapSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await adminApi.listRoadmaps();
      setRoadmaps(rows);
    } catch {
      toast.error('Could not load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSlug = (v: string) =>
    v
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setError('');
  };

  const handleCreate = async () => {
    setError('');
    if (!title || title.length < 2) return setError('Title is too short');
    if (!slug || slug.length < 2) return setError('Slug is too short');
    if (!/^[a-z0-9-]+$/.test(slug)) return setError('Invalid slug');
    if (!description || description.length < 5)
      return setError('Description is too short');

    setBusy(true);
    try {
      const created = await adminApi.createRoadmap({
        title,
        slug,
        description,
      });
      setRoadmaps((prev) => [
        {
          _id: created._id,
          title: created.title,
          slug: created.slug,
          description: created.description,
          tagline: created.tagline,
          tags: created.tags,
          badge: created.badge,
          thumbnail: created.thumbnail,
          isFree: created.isFree,
          price: created.price,
          originalPrice: created.originalPrice,
          courseCount: created.courses?.length ?? 0,
          published: created.published,
          updatedAt: created.updatedAt,
        },
        ...prev,
      ]);
      resetForm();
      setShowForm(false);
      toast.success(`Created "${created.title}"`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create roadmap'
      );
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (r: AdminRoadmapSummary) => {
    try {
      await adminApi.setRoadmapPublished(r.slug, !r.published);
      setRoadmaps((prev) =>
        prev.map((x) =>
          x._id === r._id ? { ...x, published: !r.published } : x
        )
      );
    } catch {
      toast.error('Could not update publish state');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await adminApi.deleteRoadmap(deleting.slug);
      setRoadmaps((prev) => prev.filter((x) => x._id !== deleting._id));
      toast.success('Roadmap deleted');
    } catch {
      toast.error('Could not delete roadmap');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Roadmaps</h1>
          <p className="mt-1 text-sm text-text-muted">
            Create learning paths. Each roadmap reuses existing courses — no
            duplication.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm((v) => !v);
            if (showForm) resetForm();
          }}
        >
          <Plus size={16} /> {showForm ? 'Close' : 'New Roadmap'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Create a roadmap
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
          </div>
          <p className="mt-3 text-xs text-text-muted">
            New roadmaps start as <strong>free</strong> and <strong>draft</strong>.
            Add courses, set pricing, and publish from the edit page.
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

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <AdminTable
          headers={['Title', 'Courses', 'Price', 'Status', 'Actions']}
        >
          {roadmaps.map((r) => (
            <tr key={r._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Map size={14} className="text-brand-500" />
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">{r.title}</p>
                    <p className="text-xs text-text-muted">
                      /roadmaps/{r.slug}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {r.courseCount}
              </td>
              <td className="px-4 py-3">
                {r.isFree ? (
                  <span className="rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)]">
                    Free
                  </span>
                ) : (
                  <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
                    {r.price ? formatINR(r.price) : '—'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => togglePublished(r)}
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    r.published
                      ? 'text-[var(--color-success)]'
                      : 'text-text-muted'
                  }`}
                  title={r.published ? 'Published' : 'Draft'}
                >
                  {r.published ? <Eye size={12} /> : <EyeOff size={12} />}
                  {r.published ? 'Live' : 'Draft'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Link to={`/admin/roadmaps/${r.slug}`}>
                    <Button size="sm" variant="ghost" title="Manage">
                      <Edit size={14} /> Manage
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(r)}
                    title="Delete"
                  >
                    <Trash2
                      size={14}
                      className="text-[var(--color-error)]"
                    />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {roadmaps.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-text-muted"
              >
                No roadmaps yet. Create the first one.
              </td>
            </tr>
          )}
        </AdminTable>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete roadmap?"
        message={`This will permanently delete "${deleting?.title}". Courses inside it are not deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};