import { Plus, Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn } from '@/shared/lib/utils';

export interface EditableTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface Props {
  testCases: EditableTestCase[];
  onChange: (testCases: EditableTestCase[]) => void;
}

export const TestCaseEditor: React.FC<Props> = ({ testCases, onChange }) => {
  const update = (i: number, patch: Partial<EditableTestCase>) => {
    onChange(testCases.map((tc, idx) => (idx === i ? { ...tc, ...patch } : tc)));
  };

  const add = () => {
    onChange([
      ...testCases,
      { input: '', expectedOutput: '', isHidden: false },
    ]);
  };

  const remove = (i: number) => {
    onChange(testCases.filter((_, idx) => idx !== i));
  };

  const visibleCount = testCases.filter((t) => !t.isHidden).length;
  const hiddenCount = testCases.filter((t) => t.isHidden).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {visibleCount} visible · {hiddenCount} hidden
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={add}>
          <Plus size={14} /> Add Test Case
        </Button>
      </div>

      {/* Input format hint */}
      <div className="rounded-lg border border-border bg-surface-secondary p-3 text-xs text-text-muted">
        <p className="font-semibold text-text-secondary">Input format (JSON)</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>
            Multiple values:{' '}
            <code className="font-mono text-text-primary">[2, 3]</code>
          </li>
          <li>
            Single number:{' '}
            <code className="font-mono text-text-primary">5</code>
          </li>
          <li>
            String:{' '}
            <code className="font-mono text-text-primary">"hello"</code>
          </li>
          <li>
            Array of strings:{' '}
            <code className="font-mono text-text-primary">
              {'["a","b","c"]'}
            </code>
          </li>
          <li>
            Object:{' '}
            <code className="font-mono text-text-primary">
              {'{"name":"Ada","age":36}'}
            </code>
          </li>
          <li>Empty (no input): leave blank</li>
        </ul>
        <p className="mt-2 text-[var(--color-warning)]">
          💡 Cover edge cases with your test cases: empty input, negative
          numbers, large values, unexpected types.
        </p>
        <p className="mt-2">
          🔒 Hidden tests are only visible to admins. Students see the input
          during execution but never the expected output - only a
          SHA-256 hash is stored on the server.
        </p>
      </div>

      {testCases.map((tc, i) => (
        <div
          key={i}
          className={cn(
            'rounded-lg border p-3',
            tc.isHidden
              ? 'border-brand-500/40 bg-brand-500/5'
              : 'border-border bg-surface-secondary'
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">
                Test #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => update(i, { isHidden: !tc.isHidden })}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors',
                  tc.isHidden
                    ? 'bg-brand-500/15 text-brand-500 hover:bg-brand-500/25'
                    : 'bg-surface-tertiary text-text-muted hover:bg-surface-secondary'
                )}
                title={tc.isHidden ? 'Hidden from students' : 'Visible to students'}
              >
                {tc.isHidden ? <Lock size={10} /> : <Unlock size={10} />}
                {tc.isHidden ? 'Hidden' : 'Visible'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder='Input (JSON) - e.g. [2, 3] or "hello" or 5'
              value={tc.input}
              onChange={(e) => update(i, { input: e.target.value })}
            />
            <Input
              placeholder={
                tc.isHidden
                  ? 'Expected output (hashed on save)'
                  : 'Expected output - e.g. 5 or Hello, world'
              }
              value={tc.expectedOutput}
              onChange={(e) => update(i, { expectedOutput: e.target.value })}
            />
          </div>

          {tc.input.trim() !== '' && <InputFormatHint input={tc.input} />}
          {tc.isHidden && tc.expectedOutput.trim() !== '' && (
            <p className="mt-2 text-[10px] text-brand-500">
              ✓ The expected output will be hashed with SHA-256 before saving.
              It will never be retrievable in plaintext.
            </p>
          )}
        </div>
      ))}

      {testCases.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted">
          No test cases yet. Add at least one.
        </p>
      )}
    </div>
  );
};

const InputFormatHint: React.FC<{ input: string }> = ({ input }) => {
  const trimmed = input.trim();
  let parsed: unknown;
  let isJson = true;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    isJson = false;
    parsed = trimmed;
  }

  if (!isJson) {
    return (
      <p className="mt-2 text-[10px] text-[var(--color-warning)]">
        ⚠️ Not valid JSON - will be injected as a string:{' '}
        <code className="font-mono">"{trimmed}"</code>
      </p>
    );
  }

  let kind = 'value';
  if (Array.isArray(parsed)) kind = `array of ${parsed.length}`;
  else if (parsed === null) kind = 'null';
  else if (typeof parsed === 'string') kind = 'string';
  else if (typeof parsed === 'number') kind = 'number';
  else if (typeof parsed === 'boolean') kind = 'boolean';
  else if (typeof parsed === 'object') kind = 'object';

  return (
    <p className="mt-2 text-[10px] text-[var(--color-success)]">
      ✓ Valid JSON - will be injected as a {kind}
    </p>
  );
};