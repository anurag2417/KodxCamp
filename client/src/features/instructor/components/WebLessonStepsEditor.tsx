import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

export interface EditableWebLessonStep {
  title: string;
  instructions: string;
  hint: string;
  starterFiles: {
    'index.html': string;
    'styles.css': string;
    'script.js': string;
  };
  webChecks: {
    requiredHtml: string[];
    requiredCss: string[];
    requiredJs: string[];
  };
}

interface Props {
  steps: EditableWebLessonStep[];
  onChange: (steps: EditableWebLessonStep[]) => void;
}

function newStep(index: number): EditableWebLessonStep {
  return {
    title: `Step ${index + 1}`,
    instructions: '',
    hint: '',
    starterFiles: {
      'index.html': `<!DOCTYPE html>
<html>
<head>
  <title>Step ${index + 1}</title>
</head>
<body>
  <!-- Your starting HTML -->
</body>
</html>`,
      'styles.css': '',
      'script.js': '',
    },
    webChecks: {
      requiredHtml: [],
      requiredCss: [],
      requiredJs: [],
    },
  };
}

export const WebLessonStepsEditor: React.FC<Props> = ({ steps, onChange }) => {
  const update = (i: number, patch: Partial<EditableWebLessonStep>) => {
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const updateStarterFile = (
    i: number,
    fileName: keyof EditableWebLessonStep['starterFiles'],
    value: string
  ) => {
    const step = steps[i];
    update(i, {
      starterFiles: { ...step.starterFiles, [fileName]: value },
    });
  };

  const updateWebCheck = (
    i: number,
    key: keyof EditableWebLessonStep['webChecks'],
    raw: string
  ) => {
    const step = steps[i];
    update(i, {
      webChecks: {
        ...step.webChecks,
        [key]: raw
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      },
    });
  };

  const add = () => onChange([...steps, newStep(steps.length)]);

  const remove = (i: number) => {
    if (!confirm('Delete this step?')) return;
    onChange(steps.filter((_, idx) => idx !== i));
  };

  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const [item] = next.splice(i, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {steps.length} step{steps.length === 1 ? '' : 's'} · students pass each
          step before advancing
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={add}>
          <Plus size={14} /> Add step
        </Button>
      </div>

      {steps.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted">
          No steps yet. Add at least one to enable step-by-step mode for this
          lesson.
        </p>
      )}

      {steps.map((step, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-text-muted" />
              <span className="text-xs font-semibold text-text-secondary">
                Step {i + 1}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded p-1 text-text-muted hover:bg-surface-tertiary disabled:opacity-40"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === steps.length - 1}
                className="rounded p-1 text-text-muted hover:bg-surface-tertiary disabled:opacity-40"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                title="Delete step"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder="Step title"
              value={step.title}
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <Input
              placeholder="Optional hint (shown behind a toggle)"
              value={step.hint}
              onChange={(e) => update(i, { hint: e.target.value })}
            />
          </div>

          <textarea
            placeholder="Instructions for this step (Markdown-ish, shown above the editor)"
            rows={4}
            value={step.instructions}
            onChange={(e) => update(i, { instructions: e.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
          />

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {(['index.html', 'styles.css', 'script.js'] as const).map((fileName) => (
              <label key={fileName} className="text-xs font-semibold text-text-secondary">
                Starter {fileName}
                <textarea
                  rows={6}
                  value={step.starterFiles[fileName]}
                  onChange={(e) =>
                    updateStarterFile(i, fileName, e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[11px] font-normal text-text-primary focus:border-brand-500 focus:outline-none"
                />
              </label>
            ))}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {(['requiredHtml', 'requiredCss', 'requiredJs'] as const).map((key) => (
              <label key={key} className="text-xs font-semibold text-text-secondary">
                {key === 'requiredHtml'
                  ? 'Required HTML tokens'
                  : key === 'requiredCss'
                    ? 'Required CSS tokens'
                    : 'Required JS tokens'}
                <textarea
                  rows={4}
                  placeholder={'One token per line, e.g.\n<div class="card"'}
                  value={step.webChecks[key].join('\n')}
                  onChange={(e) => updateWebCheck(i, key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[11px] font-normal text-text-primary focus:border-brand-500 focus:outline-none"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};