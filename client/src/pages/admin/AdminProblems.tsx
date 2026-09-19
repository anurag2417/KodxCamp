import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { adminApi, type AdminProblem } from '../../lib/admin.api';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AdminTable } from '../../components/admin/AdminTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { DifficultyBadge } from '../../components/problem/DifficultyBadge';
import {
  TestCaseEditor,
  type EditableTestCase,
} from '../../components/admin/TestCaseEditor';

interface ProblemEditorState {
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  statement: string;
  functionName: string;
  outputMode: 'return' | 'print';
  starterCode: Record<string, string>;
  testCases: EditableTestCase[];
}

const emptyProblem: ProblemEditorState = {
  title: '',
  slug: '',
  difficulty: 'easy',
  statement: '',
  functionName: 'solve',
  outputMode: 'return',
  starterCode: { javascript: '', python: '' },
  testCases: [],
};

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

export const AdminProblems: React.FC = () => {
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<ProblemEditorState | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [topicsText, setTopicsText] = useState('');
  const [starterCodeText, setStarterCodeText] = useState('{}');

  const [deleting, setDeleting] = useState<AdminProblem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/problems');
      setProblems(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const autoSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const openCreate = () => {
    setEditing({
      ...emptyProblem,
      starterCode: { javascript: '', python: '' },
    });
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
      statement: full.statement,
      functionName: full.functionName ?? 'solve',
      outputMode: full.outputMode ?? 'return',
      starterCode: {
        javascript: full.starterCode.javascript ?? '',
        python: full.starterCode.python ?? '',
      },
      testCases: full.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      })),
    });
    setTopicsText(full.topics.join(', '));
    setStarterCodeText(JSON.stringify(full.starterCode, null, 2));
    setOriginalSlug(full.slug);
    setError('');
  };

  const closeEditor = () => {
    setEditing(null);
    setOriginalSlug(null);
    setError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setBusy(true);
    setError('');

    // Parse starterCode JSON
    let starterCode: Record<string, string> = {};
    try {
      const parsed = JSON.parse(starterCodeText);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error('must be a JSON object');
      }
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v !== 'string') {
          throw new Error(`key "${k}" must map to a string`);
        }
      }
      starterCode = parsed as Record<string, string>;
    } catch (e) {
      setError(
        `Starter code must be a JSON object like {"javascript": "...", "python": "..."}.\n${
          e instanceof Error ? e.message : ''
        }`
      );
      setBusy(false);
      return;
    }

    // Client-side pre-validation
    const issues: string[] = [];
    if (!editing.title || editing.title.length < 2) {
      issues.push('Title must be at least 2 characters');
    }
    if (!editing.slug || editing.slug.length < 2) {
      issues.push('Slug must be at least 2 characters');
    }
    if (!/^[a-z0-9-]+$/.test(editing.slug)) {
      issues.push(
        'Slug can only contain lowercase letters, numbers, and dashes'
      );
    }
    if (!editing.statement || editing.statement.length < 10) {
      issues.push('Statement must be at least 10 characters');
    }
    if (
      !editing.functionName ||
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(editing.functionName)
    ) {
      issues.push(
        'Function name must be a valid identifier (letters, digits, underscores; cannot start with a digit)'
      );
    }
    if (editing.testCases.length === 0) {
      issues.push('At least one test case is required');
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
      difficulty: editing.difficulty,
      topics: topicsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      statement: editing.statement,
      functionName: editing.functionName,
      outputMode: editing.outputMode,
      starterCode,
      testCases: editing.testCases,
    };

    try {
      if (originalSlug) {
        await adminApi.updateProblem(originalSlug, payload);
      } else {
        await adminApi.createProblem(payload);
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
    if (!deleting) return;
    try {
      await adminApi.deleteProblem(deleting.slug);
      await reload();
      setDeleting(null);
    } catch (err) {
      setError(extractError(err));
      setDeleting(null);
    }
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Problems</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage DSA practice problems. Need to add many at once?{' '}
            <a
              href="/admin/bulk-import"
              className="text-brand-500 hover:underline"
            >
              Use bulk import →
            </a>
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New Problem
        </Button>
      </div>

      {editing && (
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              {originalSlug ? 'Edit problem' : 'New problem'}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeEditor}>
              Cancel
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
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
            />
            <Input
              placeholder="Slug (lowercase, dashes)"
              value={editing.slug}
              onChange={(e) =>
                setEditing({ ...editing, slug: autoSlug(e.target.value) })
              }
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

          {/* Function name + output mode */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Function name
              </label>
              <Input
                placeholder="e.g. sum, twoSum, reverseString"
                value={editing.functionName}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    functionName: e.target.value.trim(),
                  })
                }
              />
              <p className="mt-1 text-[10px] text-text-muted">
                JS: <code>function {editing.functionName || 'name'}(...)</code>{' '}
                · Python:{' '}
                <code>def {editing.functionName || 'name'}(...):</code>
              </p>
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
                <option value="return">Return value (recommended)</option>
                <option value="print">Print to console</option>
              </select>
              <p className="mt-1 text-[10px] text-text-muted">
                {editing.outputMode === 'return'
                  ? 'Student returns a value; the platform compares it to Expected Output.'
                  : 'Student prints; the platform compares stdout to Expected Output.'}
              </p>
            </div>
          </div>

          <textarea
            placeholder="Problem statement"
            rows={5}
            value={editing.statement}
            onChange={(e) =>
              setEditing({ ...editing, statement: e.target.value })
            }
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
          />

          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              Starter code (JSON)
            </label>
            <textarea
              rows={6}
              value={starterCodeText}
              onChange={(e) => setStarterCodeText(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-text-muted">
              Students define only the function — do NOT include{' '}
              <code>__input__</code> or <code>console.log</code> in the starter
              code. The runner calls the function for them.
            </p>
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
        <AdminTable
          headers={['Title', 'Difficulty', 'Function', 'Topics', 'Actions']}
        >
          {problems.map((p) => (
            <tr key={p._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{p.title}</p>
                <p className="text-xs text-text-muted">/practice/{p.slug}</p>
              </td>
              <td className="px-4 py-3">
                <DifficultyBadge difficulty={p.difficulty} />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                {p.functionName ?? '—'}
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
          {problems.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-text-muted"
              >
                No problems yet. Add your first one.
              </td>
            </tr>
          )}
        </AdminTable>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete problem?"
        message={`This will permanently delete "${deleting?.title}". Existing submissions from users will remain but the problem will disappear.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};