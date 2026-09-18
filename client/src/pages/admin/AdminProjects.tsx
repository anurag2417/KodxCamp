import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { adminApi, type AdminProject } from '../../lib/admin.api';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AdminTable } from '../../components/admin/AdminTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

const CATEGORIES = ['frontend', 'react', 'api', 'sql', 'dataviz', 'javascript'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const PREVIEW_MODES = ['html', 'react', 'sql', 'none'];

export const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AdminProject> | null>(null);
  const [filesJson, setFilesJson] = useState('[]');
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    const { data } = await api.get('/projects');
    // /projects returns summaries; the client-side table only needs those + slug
    setProjects(data.data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const autoSlug = (val: string) =>
    val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  const emptyProject: Partial<AdminProject> = {
    title: '',
    slug: '',
    description: '',
    longDescription: '',
    category: 'frontend',
    difficulty: 'beginner',
    topics: [],
    files: [],
    previewMode: 'html',
    instructions: '',
    estimatedMinutes: 60,
    xpReward: 100,
  };

  const openCreate = () => {
    setEditing(emptyProject);
    setFilesJson(
      JSON.stringify(
        [
          {
            name: 'index.html',
            language: 'html',
            content: '<h1>Hello</h1>',
            isEntry: true,
          },
        ],
        null,
        2
      )
    );
    setOriginalSlug(null);
    setError('');
  };

  const openEdit = async (p: AdminProject) => {
    const full = await adminApi.getProjectFull(p.slug);
    setEditing(full);
    setFilesJson(JSON.stringify(full.files, null, 2));
    setOriginalSlug(full.slug);
    setError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      let files: unknown;
      try {
        files = JSON.parse(filesJson);
      } catch {
        setError('Files must be valid JSON');
        setBusy(false);
        return;
      }

      const payload = {
        title: editing.title ?? '',
        slug: editing.slug ?? '',
        description: editing.description ?? '',
        longDescription: editing.longDescription ?? '',
        category: editing.category ?? 'frontend',
        difficulty: editing.difficulty ?? 'beginner',
        topics: editing.topics ?? [],
        files: files as { name: string; language: string; content: string }[],
        previewMode: editing.previewMode ?? 'html',
        instructions: editing.instructions ?? '',
        estimatedMinutes: editing.estimatedMinutes ?? 60,
        xpReward: editing.xpReward ?? 100,
      };

      if (originalSlug) {
        await adminApi.updateProject(originalSlug, payload);
      } else {
        await adminApi.createProject(payload);
      }

      await reload();
      setEditing(null);
      setOriginalSlug(null);
    } catch {
      setError('Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await adminApi.deleteProject(deleting.slug);
    await reload();
    setDeleting(null);
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Projects</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage project starter templates.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New Project
        </Button>
      </div>

      {editing && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            {originalSlug ? 'Edit project' : 'New project'}
          </h2>

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
              onChange={(e) => setEditing({ ...editing, slug: autoSlug(e.target.value) })}
            />
            <select
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={editing.difficulty}
              onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={editing.previewMode}
              onChange={(e) =>
                setEditing({ ...editing, previewMode: e.target.value as 'html' | 'react' | 'sql' | 'none' })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {PREVIEW_MODES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="XP reward"
              value={editing.xpReward ?? 100}
              onChange={(e) => setEditing({ ...editing, xpReward: Number(e.target.value) })}
            />
          </div>

          <Input
            placeholder="Short description"
            value={editing.description ?? ''}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="mt-3"
          />

          <textarea
            placeholder="Instructions"
            rows={3}
            value={editing.instructions ?? ''}
            onChange={(e) => setEditing({ ...editing, instructions: e.target.value })}
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />

          <label className="mt-3 block text-xs font-semibold text-text-secondary">
            Files (JSON)
          </label>
          <textarea
            rows={10}
            value={filesJson}
            onChange={(e) => setFilesJson(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
          />

          {error && <p className="mt-3 text-xs text-[var(--color-error)]">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? 'Saving...' : 'Save Project'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <AdminTable headers={['Title', 'Category', 'Difficulty', 'Actions']}>
          {projects.map((p) => (
            <tr key={p._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{p.title}</p>
                <p className="text-xs text-text-muted">/projects/{p.slug}</p>
              </td>
              <td className="px-4 py-3 text-text-secondary">{p.category}</td>
              <td className="px-4 py-3 text-text-secondary">{p.difficulty}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>
                    <Trash2 size={14} className="text-[var(--color-error)]" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete project?"
        message={`This will permanently delete "${deleting?.title}".`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};