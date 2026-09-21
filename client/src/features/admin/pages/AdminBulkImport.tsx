import { useState } from 'react';
import { Upload, Play, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  adminApi,
  type BulkKind,
  type BulkMode,
  type BulkImportReport,
} from '@/features/admin/api';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { cn } from '@/shared/lib/utils';

const KINDS: { value: BulkKind; label: string; description: string }[] = [
  {
    value: 'problems',
    label: 'Problems',
    description: 'DSA problems with test cases',
  },
  {
    value: 'projects',
    label: 'Projects',
    description: 'Project starter templates with files',
  },
  {
    value: 'courses',
    label: 'Courses',
    description: 'Courses with their lessons',
  },
];

const TEMPLATES: Record<BulkKind, unknown[]> = {
  problems: [
    {
      title: 'Multiply Two Numbers',
      slug: 'multiply-two-numbers',
      difficulty: 'easy',
      topics: ['math', 'arithmetic'],
      statement:
        'Given two integers `a` and `b`, return their product.\n\n**Example:**\nInput: [3, 4]\nOutput: 12',
      functionName: 'multiply',
      outputMode: 'return',
      starterCode: {
        javascript: 'function multiply(a, b) {\n  // TODO\n}',
        python: 'def multiply(a, b):\n    # TODO\n    pass',
      },
      testCases: [
        { input: '[3, 4]', expectedOutput: '12' },
        { input: '[0, 100]', expectedOutput: '0' },
        { input: '[-2, 5]', expectedOutput: '-10' },
        { input: '[-3, -4]', expectedOutput: '12' },
      ],
    },
  ],
  projects: [
    {
      title: 'Hello Card',
      slug: 'hello-card',
      description: 'A simple card with a greeting.',
      longDescription: 'Practice HTML and CSS by building a card.',
      category: 'frontend',
      difficulty: 'beginner',
      topics: ['html', 'css'],
      previewMode: 'html',
      instructions: 'Create a card with a greeting message and a styled button.',
      estimatedMinutes: 20,
      xpReward: 40,
      files: [
        {
          name: 'index.html',
          language: 'html',
          isEntry: true,
          content:
            '<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <div class="card">Hello!</div>\n</body>\n</html>',
        },
        {
          name: 'style.css',
          language: 'css',
          content:
            'body { font-family: system-ui; display: grid; place-items: center; min-height: 100vh; margin: 0; }\n.card { padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }',
        },
      ],
    },
  ],
  courses: [
    {
      title: 'Intro to Algorithms',
      slug: 'intro-to-algorithms',
      description: 'A beginner course on algorithms and complexity.',
      language: 'javascript',
      lessons: [
        {
          title: 'What is an Algorithm?',
          slug: 'what-is-an-algorithm',
          order: 1,
          content:
            'An algorithm is a step-by-step procedure. Write a function that returns the maximum of two numbers.',
          starterCode:
            'function max(a, b) {\n  // TODO: return the larger\n}',
          solution: 'function max(a, b) {\n  return a > b ? a : b;\n}',
          functionName: 'max',
          outputMode: 'return',
          testCases: [
            { input: '[3, 7]', expectedOutput: '7' },
            { input: '[10, 2]', expectedOutput: '10' },
          ],
        },
      ],
    },
  ],
};

export const AdminBulkImport: React.FC = () => {
  const [kind, setKind] = useState<BulkKind>('problems');
  const [mode, setMode] = useState<BulkMode>('merge');
  const [json, setJson] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<BulkImportReport | null>(null);
  const [error, setError] = useState('');

  const parseItems = (): unknown => {
    if (!json.trim()) throw new Error('Paste JSON first');
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error('Top-level must be an array: [ { ... }, { ... } ]');
    }
    return parsed;
  };

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setError('');
    setReport(null);

    try {
      const items = parseItems();
      const res = await adminApi.bulkImport({ kind, mode, dryRun, items });
      setReport(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const loadTemplate = () => {
    setJson(JSON.stringify(TEMPLATES[kind], null, 2));
    setReport(null);
    setError('');
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Bulk Import</h1>
        <p className="mt-1 text-sm text-text-muted">
          Paste a JSON array to create or update many items at once.
        </p>
      </div>

      {/* Kind */}
      <Card className="mb-4 p-6">
        <label className="mb-2 block text-xs font-semibold text-text-secondary">
          What are you importing?
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => {
                setKind(k.value);
                setReport(null);
              }}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                kind === k.value
                  ? 'border-brand-500 bg-brand-500/5'
                  : 'border-border bg-surface hover:bg-surface-secondary'
              )}
            >
              <p className="text-sm font-semibold text-text-primary">{k.label}</p>
              <p className="mt-0.5 text-xs text-text-muted">{k.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Mode */}
      <Card className="mb-4 p-6">
        <label className="mb-2 block text-xs font-semibold text-text-secondary">
          Mode
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('merge')}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors',
              mode === 'merge'
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-border bg-surface hover:bg-surface-secondary'
            )}
          >
            <p className="text-sm font-semibold text-text-primary">
              Merge (recommended)
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Update items with matching slugs; create new ones.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode('replace')}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors',
              mode === 'replace'
                ? 'border-[var(--color-error)] bg-[var(--color-error)]/5'
                : 'border-border bg-surface hover:bg-surface-secondary'
            )}
          >
            <p className="text-sm font-semibold text-[var(--color-error)]">
              Replace (dangerous)
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Delete ALL existing items of this type first, then insert.
            </p>
          </button>
        </div>
      </Card>

      {/* JSON */}
      <Card className="mb-4 p-6">
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-xs font-semibold text-text-secondary">
            JSON array
          </label>
          <Button size="sm" variant="secondary" onClick={loadTemplate}>
            Load sample
          </Button>
        </div>
        <textarea
          rows={16}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='[\n  {\n    "title": "...",\n    "slug": "..."\n  }\n]'
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => run(true)}
            disabled={busy || !json.trim()}
          >
            <Play size={14} /> Dry run
          </Button>
          <Button onClick={() => run(false)} disabled={busy || !json.trim()}>
            <Upload size={14} /> {busy ? 'Importing...' : 'Import'}
          </Button>
        </div>

        {error && (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-3 text-xs text-[var(--color-error)]">
            {error}
          </pre>
        )}
      </Card>

      {/* Report */}
      {report && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Report</h2>

          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Stat label="Processed" value={report.totalProcessed} />
            <Stat label="Created" value={report.created} tone="success" />
            <Stat label="Updated" value={report.updated} tone="brand" />
            <Stat label="Failed" value={report.failed.length} tone="error" />
          </div>

          {report.failed.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-error)]">
                <AlertTriangle size={14} /> Errors
              </p>
              <ul className="space-y-1 text-xs">
                {report.failed.map((f, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-2 font-mono text-[var(--color-error)]"
                  >
                    Index {f.index}
                    {f.slug ? ` (slug: ${f.slug})` : ''}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.failed.length === 0 && report.totalProcessed > 0 && (
            <p className="flex items-center gap-2 text-xs font-medium text-[var(--color-success)]">
              <CheckCircle2 size={14} /> All items validated successfully.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

const Stat: React.FC<{
  label: string;
  value: number;
  tone?: 'brand' | 'success' | 'error';
}> = ({ label, value, tone = 'brand' }) => {
  const color =
    tone === 'success'
      ? 'text-[var(--color-success)]'
      : tone === 'error'
      ? 'text-[var(--color-error)]'
      : 'text-brand-500';
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
    </div>
  );
};
