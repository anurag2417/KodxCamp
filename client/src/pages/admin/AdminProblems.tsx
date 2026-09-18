import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { adminApi, type AdminProblem } from '../../lib/admin.api';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AdminTable } from '../../components/admin/AdminTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { DifficultyBadge } from '../../components/problem/DifficultyBadge';
import { TestCaseEditor, type EditableTestCase } from '../../components/admin/TestCaseEditor';

const emptyProblem = {
  title: '',
  slug: '',
  difficulty: 'easy' as 'easy' | 'medium' | 'hard',
  topics: [] as string[],
  statement: '',
  starterCode: { javascript: '', python: '' },
  testCases: [] as EditableTestCase[],
};

export const AdminProblems: React.FC = () => {
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<typeof emptyProblem | null>(null);
  const [topicsText, setTopicsText] = useState('');
  const [starterCodeText, setStarterCodeText] = useState('{}');
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminProblem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    const { data } = await api.get('/problems');
    setProblems(data.data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const autoSlug = (val: string) =>
    val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  const openCreate = () => {
    setEditing({ ...emptyProblem, starterCode: { javascript: '', python: '' } });
    setTopicsText('');
    setStarterCodeText(JSON.stringify({ javascript: '', python: '' }, null, 2));
    setOriginalSlug(null);
    setError('');
  };

  const openEdit = async (p: AdminProblem) => {
    const full = await adminApi.getProblemFull(p.slug);
    setEditing({
      title: full.title,
      slug: full.slug,
      difficulty: full.difficulty,
      topics: full.topics,
      statement: full.statement,
      starterCode: {
        javascript: full.starterCode.javascript ?? '',
        python: full.starterCode.python ?? '',
      },
      testCases: full.testCases,
    });
    setTopicsText(full.topics.join(', '));
    setStarterCodeText(JSON.stringify(full.starterCode, null, 2));
    setOriginalSlug(full.slug);
    setError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      let starterCode: Record<string, string> = {};
      try {
        starterCode = JSON.parse(starterCodeText);
      } catch {
        setError('Starter code must be valid JSON');
        setBusy(false);
        return;
      }

      const payload = {
        title: editing.title,
        slug: editing.slug,
        difficulty: editing.difficulty,
        topics: topicsText.split(',').map((t) => t.trim()).filter(Boolean),
        statement: editing.statement,
        starterCode,
        testCases: editing.testCases,
      };

      if (originalSlug) {
        await adminApi.updateProblem(originalSlug, payload);
      } else {
        await adminApi.createProblem(payload);
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
    await adminApi.deleteProblem(deleting.slug);
    await reload();
    setDeleting(null);
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Problems</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage DSA practice problems.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New Problem
        </Button>
      </div>

      {editing && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            {originalSlug ? 'Edit problem' : 'New problem'}
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Title"
              value={editing.title}
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
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: autoSlug(e.target.value) })}
            />
            <select
              value={editing.difficulty}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <Input
              placeholder="Topics (comma-separated)"
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
            />
          </div>

          <textarea
            placeholder="Problem statement"
            rows={5}
            value={editing.statement}
            onChange={(e) => setEditing({ ...editing, statement: e.target.value })}
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
          />

          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              Starter code (JSON)
            </label>
            <textarea
              rows={5}
              value={starterCodeText}
              onChange={(e) => setStarterCodeText(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-text-muted">
              Example: {'{ "javascript": "function solve() {}", "python": "def solve(): pass" }'}
            </p>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-text-secondary">Test Cases</p>
            <TestCaseEditor
              testCases={editing.testCases}
              onChange={(tcs) => setEditing({ ...editing, testCases: tcs })}
            />
          </div>

          {error && <p className="mt-3 text-xs text-[var(--color-error)]">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? 'Saving...' : 'Save Problem'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <AdminTable headers={['Title', 'Difficulty', 'Topics', 'Actions']}>
          {problems.map((p) => (
            <tr key={p._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{p.title}</p>
                <p className="text-xs text-text-muted">/practice/{p.slug}</p>
              </td>
              <td className="px-4 py-3">
                <DifficultyBadge difficulty={p.difficulty} />
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {p.topics?.join(', ')}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(p)}
                    title="Delete"
                  >
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
        title="Delete problem?"
        message={`This will permanently delete "${deleting?.title}".`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};