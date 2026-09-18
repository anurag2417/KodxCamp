import { Plus, Trash2, EyeOff, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
    onChange([...testCases, { input: '', expectedOutput: '', isHidden: false }]);
  };

  const remove = (i: number) => {
    onChange(testCases.filter((_, idx) => idx !== i));
  };

  const visible = testCases.filter((t) => !t.isHidden).length;
  const hidden = testCases.filter((t) => t.isHidden).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {visible} visible · {hidden} hidden
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={add}>
          <Plus size={14} /> Add Test Case
        </Button>
      </div>

      {testCases.map((tc, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-surface-secondary p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              Test #{i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => update(i, { isHidden: !tc.isHidden })}
                className="rounded p-1 text-text-muted hover:bg-surface-tertiary hover:text-text-secondary"
                title={tc.isHidden ? 'Make visible' : 'Hide test'}
              >
                {tc.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder="Input (e.g. [1,2,3], 5)"
              value={tc.input}
              onChange={(e) => update(i, { input: e.target.value })}
            />
            <Input
              placeholder="Expected output"
              value={tc.expectedOutput}
              onChange={(e) => update(i, { expectedOutput: e.target.value })}
            />
          </div>
        </div>
      ))}

      {testCases.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted">
          No test cases yet. Add one above.
        </p>
      )}
    </div>
  );
};