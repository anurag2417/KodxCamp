import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import {
  adminApi,
  type AdminProject,
  type AdminProjectRubricCategory,
  type AdminProjectTest,
} from '@/features/admin/api';
import { api } from '@/shared/lib/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { AdminTable } from '@/features/admin/components/AdminTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';

const CATEGORIES = ['frontend', 'react', 'api', 'sql', 'dataviz', 'javascript'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const PREVIEW_MODES = ['html', 'react', 'sql', 'none'];
const MODES: { value: AdminProject['mode']; label: string }[] = [
  { value: 'required', label: 'Required — everyone builds the same thing' },
  { value: 'recommended', label: 'Recommended — default + alternatives' },
  { value: 'open_choice', label: 'Open Choice — student picks' },
];

function listToTextarea(arr: string[] | undefined): string {
  return (arr ?? []).join('\n');
}

function textareaToList(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateTests(tests: unknown): string | null {
  if (!Array.isArray(tests)) return 'tests must be an array';

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const where = `Test #${i + 1}`;
    if (typeof t !== 'object' || t === null) {
      return `${where}: must be an object`;
    }
    const obj = t as Record<string, unknown>;
    if (typeof obj.name !== 'string' || obj.name.trim().length === 0) {
      return `${where}: name is required`;
    }
    if (typeof obj.check !== 'object' || obj.check === null) {
      return `${where}: check is required`;
    }
    const check = obj.check as Record<string, unknown>;
    if (typeof check.type !== 'string') {
      return `${where}: check.type is required`;
    }

    switch (check.type) {
      case 'dom-exists':
        if (typeof check.selector !== 'string' || check.selector.length === 0) {
          return `${where}: dom-exists requires a selector`;
        }
        break;
      case 'dom-text':
        if (typeof check.selector !== 'string' || check.selector.length === 0) {
          return `${where}: dom-text requires a selector`;
        }
        if (check.mode !== 'equals' && check.mode !== 'matches') {
          return `${where}: dom-text requires mode "equals" or "matches"`;
        }
        if (typeof check.value !== 'string') {
          return `${where}: dom-text requires value`;
        }
        break;
      case 'dom-attribute':
        if (typeof check.selector !== 'string' || check.selector.length === 0) {
          return `${where}: dom-attribute requires a selector`;
        }
        if (
          typeof check.attribute !== 'string' ||
          check.attribute.length === 0
        ) {
          return `${where}: dom-attribute requires attribute`;
        }
        if (typeof check.value !== 'string') {
          return `${where}: dom-attribute requires value`;
        }
        break;
      case 'dom-count':
        if (typeof check.selector !== 'string' || check.selector.length === 0) {
          return `${where}: dom-count requires a selector`;
        }
        if (typeof check.count !== 'number') {
          return `${where}: dom-count requires count (a number)`;
        }
        break;
      case 'event-click':
        if (typeof check.selector !== 'string' || check.selector.length === 0) {
          return `${where}: event-click requires a selector`;
        }
        if (typeof check.assert !== 'object' || check.assert === null) {
          return `${where}: event-click requires an assert object`;
        }
        break;
      case 'event-input':
        if (typeof check.selector !== 'string' || check.selector.length === 0) {
          return `${where}: event-input requires a selector`;
        }
        if (typeof check.value !== 'string') {
          return `${where}: event-input requires value`;
        }
        if (typeof check.assert !== 'object' || check.assert === null) {
          return `${where}: event-input requires an assert object`;
        }
        break;
      case 'visual-nonblank':
        if (typeof check.minimumChars !== 'number' || check.minimumChars < 1) {
          return `${where}: visual-nonblank requires minimumChars (a positive number)`;
        }
        break;
      default:
        return `${where}: unknown check type "${check.type}"`;
    }
  }

  return null;
}

export const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AdminProject> | null>(null);
  const [filesJson, setFilesJson] = useState('[]');
  const [rubricJson, setRubricJson] = useState('[]');
  const [testsJson, setTestsJson] = useState('[]');
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    const { data } = await api.get('/projects');
    setProjects(data.data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const autoSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

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
    mode: 'required',
    specification: {
      objective: '',
      requiredFeatures: [],
      technicalRequirements: [],
      designRequirements: [],
      accessibilityRequirements: [],
      expectedBehaviour: '',
    },
    rubric: [],
    tests: [],
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
    setRubricJson('[]');
    setTestsJson('[]');
    setOriginalSlug(null);
    setError('');
  };

  const openEdit = async (p: AdminProject) => {
    const full = await adminApi.getProjectFull(p.slug);
    setEditing(full);
    setFilesJson(JSON.stringify(full.files, null, 2));
    setRubricJson(JSON.stringify(full.rubric ?? [], null, 2));
    setTestsJson(JSON.stringify(full.tests ?? [], null, 2));
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

      let rubric: AdminProjectRubricCategory[];
      try {
        const parsed = JSON.parse(rubricJson);
        if (!Array.isArray(parsed)) throw new Error('must be an array');
        for (const r of parsed) {
          if (
            typeof r !== 'object' ||
            r === null ||
            typeof r.category !== 'string' ||
            typeof r.weight !== 'number'
          ) {
            throw new Error(
              'each entry must be { category: string, weight: number }'
            );
          }
        }
        rubric = parsed as AdminProjectRubricCategory[];
      } catch (e) {
        setError(
          `Rubric must be a JSON array of { category, weight }.\n${
            e instanceof Error ? e.message : ''
          }`
        );
        setBusy(false);
        return;
      }

      if (rubric.length > 0) {
        const total = rubric.reduce((sum, r) => sum + r.weight, 0);
        if (total !== 100) {
          setError(`Rubric weights must sum to 100 (got ${total}).`);
          setBusy(false);
          return;
        }
      }

      let tests: AdminProjectTest[];
      try {
        const parsed = JSON.parse(testsJson);
        const validationError = validateTests(parsed);
        if (validationError) {
          setError(`Tests: ${validationError}`);
          setBusy(false);
          return;
        }
        tests = parsed as AdminProjectTest[];
      } catch (e) {
        setError(
          `Tests must be valid JSON.\n${
            e instanceof Error ? e.message : ''
          }`
        );
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
        mode: editing.mode ?? 'required',
        specification: editing.specification ?? {},
        rubric,
        tests,
      };

      if (originalSlug) {
        await adminApi.updateProject(originalSlug, payload);
      } else {
        await adminApi.createProject(payload);
      }

      await reload();
      setEditing(null);
      setOriginalSlug(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save project'
      );
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

  const updateSpecField = (
    key: keyof NonNullable<AdminProject['specification']>,
    value: string | string[]
  ) => {
    if (!editing) return;
    setEditing({
      ...editing,
      specification: {
        ...(editing.specification ?? {}),
        [key]: value,
      },
    });
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Projects</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage project starter templates, specifications, rubrics, and
            automated tests.
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

          {/* Metadata */}
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
            <select
              value={editing.category}
              onChange={(e) =>
                setEditing({ ...editing, category: e.target.value })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={editing.difficulty}
              onChange={(e) =>
                setEditing({ ...editing, difficulty: e.target.value })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={editing.previewMode}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  previewMode: e.target.value as
                    | 'html'
                    | 'react'
                    | 'sql'
                    | 'none',
                })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {PREVIEW_MODES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="XP reward"
              value={editing.xpReward ?? 100}
              onChange={(e) =>
                setEditing({ ...editing, xpReward: Number(e.target.value) })
              }
            />
          </div>

          <Input
            placeholder="Short description"
            value={editing.description ?? ''}
            onChange={(e) =>
              setEditing({ ...editing, description: e.target.value })
            }
            className="mt-3"
          />

          <textarea
            placeholder="Instructions"
            rows={3}
            value={editing.instructions ?? ''}
            onChange={(e) =>
              setEditing({ ...editing, instructions: e.target.value })
            }
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />

          {/* Mode */}
          <div className="mt-4 rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Project Mode
            </h3>
            <div className="flex flex-col gap-2">
              {MODES.map((m) => (
                <label
                  key={m.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={editing.mode === m.value}
                    onChange={() => setEditing({ ...editing, mode: m.value })}
                  />
                  <span className="text-text-primary">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specification */}
          <div className="mt-4 rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Specification
            </h3>

            <label className="mb-3 block text-xs font-semibold text-text-secondary">
              Objective
              <textarea
                rows={2}
                value={editing.specification?.objective ?? ''}
                onChange={(e) => updateSpecField('objective', e.target.value)}
                placeholder="One sentence: what is the student building?"
                className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-sm font-normal"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-text-secondary">
                Required features (one per line)
                <textarea
                  rows={5}
                  value={listToTextarea(editing.specification?.requiredFeatures)}
                  onChange={(e) =>
                    updateSpecField(
                      'requiredFeatures',
                      textareaToList(e.target.value)
                    )
                  }
                  className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-semibold text-text-secondary">
                Technical requirements (one per line)
                <textarea
                  rows={5}
                  value={listToTextarea(
                    editing.specification?.technicalRequirements
                  )}
                  onChange={(e) =>
                    updateSpecField(
                      'technicalRequirements',
                      textareaToList(e.target.value)
                    )
                  }
                  className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-semibold text-text-secondary">
                Design requirements (one per line)
                <textarea
                  rows={5}
                  value={listToTextarea(
                    editing.specification?.designRequirements
                  )}
                  onChange={(e) =>
                    updateSpecField(
                      'designRequirements',
                      textareaToList(e.target.value)
                    )
                  }
                  className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-semibold text-text-secondary">
                Accessibility requirements (one per line)
                <textarea
                  rows={5}
                  value={listToTextarea(
                    editing.specification?.accessibilityRequirements
                  )}
                  onChange={(e) =>
                    updateSpecField(
                      'accessibilityRequirements',
                      textareaToList(e.target.value)
                    )
                  }
                  className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-sm font-normal"
                />
              </label>
            </div>

            <label className="mt-3 block text-xs font-semibold text-text-secondary">
              Expected behaviour
              <textarea
                rows={3}
                value={editing.specification?.expectedBehaviour ?? ''}
                onChange={(e) =>
                  updateSpecField('expectedBehaviour', e.target.value)
                }
                placeholder="What happens when the student's solution is correct?"
                className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-sm font-normal"
              />
            </label>
          </div>

          {/* Rubric */}
          <div className="mt-4 rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
              AI Evaluation Rubric (JSON)
            </h3>
            <p className="mb-2 text-xs text-text-muted">
              Array of <code>{'{ category, weight }'}</code>. Weights must sum
              to 100 when non-empty.
            </p>
            <textarea
              rows={6}
              value={rubricJson}
              onChange={(e) => setRubricJson(e.target.value)}
              placeholder='[{"category":"Visual Design","weight":20}, ...]'
              className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs"
            />
          </div>

          {/* Tests */}
          <div className="mt-4 rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Automated Tests (JSON)
            </h3>
            <p className="mb-2 text-xs text-text-muted">
              Array of{' '}
              <code>{'{ name, check: { type, ... }, description? }'}</code>.
              Supported types: <code>dom-exists</code>,{' '}
              <code>dom-text</code>, <code>dom-attribute</code>,{' '}
              <code>dom-count</code>, <code>event-click</code>,{' '}
              <code>event-input</code>, <code>visual-nonblank</code>. Only run
              for <code>html</code> preview projects.
            </p>
            <textarea
              rows={10}
              value={testsJson}
              onChange={(e) => setTestsJson(e.target.value)}
              placeholder='[
  {
    "name": "Has an h1",
    "check": { "type": "dom-exists", "selector": "h1" }
  }
]'
              className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs"
            />
          </div>

          {/* Files */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-text-secondary">
              Files (JSON)
            </label>
            <textarea
              rows={10}
              value={filesJson}
              onChange={(e) => setFilesJson(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
            />
          </div>

          {error && (
            <p className="mt-3 whitespace-pre-line text-xs text-[var(--color-error)]">
              {error}
            </p>
          )}

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
        <AdminTable
          headers={[
            'Title',
            'Mode',
            'Category',
            'Difficulty',
            'Tests',
            'Actions',
          ]}
        >
          {projects.map((p) => (
            <tr key={p._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{p.title}</p>
                <p className="text-xs text-text-muted">/projects/{p.slug}</p>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-500">
                  {p.mode ?? 'required'}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{p.category}</td>
              <td className="px-4 py-3 text-text-secondary">{p.difficulty}</td>
              <td className="px-4 py-3 text-text-secondary">
                {p.tests?.length ?? 0}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Link to={`/admin/projects/${p.slug}/submissions`}>
                    <Button size="sm" variant="ghost" title="View submissions">
                      <FileText size={14} /> Submissions
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(p)}
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
          {projects.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-text-muted"
              >
                No projects yet. Create the first one.
              </td>
            </tr>
          )}
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