import { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import type { ChallengeCheck } from '@kodxcamp/shared';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn } from '@/shared/lib/utils';

export interface EditableChallenge {
  title: string;
  instructions: string;
  hint: string;
  starterCode: string;
  checks: ChallengeCheck[];
  language: string;
}

interface Props {
  challenges: EditableChallenge[];
  onChange: (challenges: EditableChallenge[]) => void;
}

function newChallenge(index: number): EditableChallenge {
  return {
    title: `Challenge ${index + 1}`,
    instructions: '',
    hint: '',
    starterCode: '',
    checks: [{ type: 'includes', value: '<h1>', label: 'Contains an h1 tag' }],
    language: 'html',
  };
}

export const TutorialChallengeEditor: React.FC<Props> = ({
  challenges,
  onChange,
}) => {
  const update = (i: number, patch: Partial<EditableChallenge>) => {
    onChange(
      challenges.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    );
  };

  const addChallenge = () => {
    onChange([...challenges, newChallenge(challenges.length)]);
  };

  const removeChallenge = (i: number) => {
    if (!confirm(`Delete challenge "${challenges[i].title}"?`)) return;
    onChange(challenges.filter((_, idx) => idx !== i));
  };

  const move = (i: number, direction: -1 | 1) => {
    const target = i + direction;
    if (target < 0 || target >= challenges.length) return;
    const next = [...challenges];
    const [item] = next.splice(i, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  const updateCheck = (
    challengeIndex: number,
    checkIndex: number,
    patch: Partial<ChallengeCheck>
  ) => {
    const challenge = challenges[challengeIndex];
    update(challengeIndex, {
      checks: challenge.checks.map((c, idx) =>
        idx === checkIndex ? ({ ...c, ...patch } as ChallengeCheck) : c
      ),
    });
  };

  const addCheck = (challengeIndex: number) => {
    const challenge = challenges[challengeIndex];
    update(challengeIndex, {
      checks: [
        ...challenge.checks,
        { type: 'includes', value: '', label: '' },
      ],
    });
  };

  const removeCheck = (challengeIndex: number, checkIndex: number) => {
    const challenge = challenges[challengeIndex];
    update(challengeIndex, {
      checks: challenge.checks.filter((_, idx) => idx !== checkIndex),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {challenges.length} challenge
          {challenges.length === 1 ? '' : 's'} · students work through them
          in order
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={addChallenge}
        >
          <Plus size={14} /> Add challenge
        </Button>
      </div>

      {challenges.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted">
          No tutorial challenges yet. Add one to turn this lesson into a
          guided, FreeCodeCamp-style exercise.
        </p>
      )}

      {challenges.map((challenge, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-text-muted" />
              <span className="text-xs font-semibold text-text-secondary">
                Challenge {i + 1}
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
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === challenges.length - 1}
                className="rounded p-1 text-text-muted hover:bg-surface-tertiary disabled:opacity-40"
                title="Move down"
              >
                <ChevronDown size={12} />
              </button>
              <button
                type="button"
                onClick={() => removeChallenge(i)}
                className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                title="Delete challenge"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder="Challenge title"
              value={challenge.title}
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <Input
              placeholder="Optional hint (shown behind a toggle)"
              value={challenge.hint}
              onChange={(e) => update(i, { hint: e.target.value })}
            />
          </div>

          <textarea
            placeholder="Instructions for the student (one or two sentences)"
            rows={3}
            value={challenge.instructions}
            onChange={(e) => update(i, { instructions: e.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
          />

          <label className="mt-2 block text-xs font-semibold text-text-secondary">
            Starter code
            <textarea
              rows={6}
              value={challenge.starterCode}
              onChange={(e) => update(i, { starterCode: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[11px] font-normal text-text-primary focus:border-brand-500 focus:outline-none"
            />
          </label>

          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary">
                Checks ({challenge.checks.length})
              </p>
              <button
                type="button"
                onClick={() => addCheck(i)}
                className="text-[11px] font-medium text-brand-500 hover:underline"
              >
                + Add check
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {challenge.checks.map((check, j) => (
                <CheckRow
                  key={j}
                  check={check}
                  onUpdate={(patch) => updateCheck(i, j, patch)}
                  onRemove={() => removeCheck(i, j)}
                />
              ))}
              {challenge.checks.length === 0 && (
                <p className="rounded border border-dashed border-border p-2 text-[11px] text-text-muted">
                  A challenge needs at least one check.
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Check row ──────────────────────────────────────────────────── */

interface CheckRowProps {
  check: ChallengeCheck;
  onUpdate: (patch: Partial<ChallengeCheck>) => void;
  onRemove: () => void;
}

const CheckRow: React.FC<CheckRowProps> = ({
  check,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-2">
      <div className="mb-2 flex items-center gap-2">
        <select
          value={check.type}
          onChange={(e) => {
            const next = e.target.value;
            if (next === 'includes') {
              onUpdate({
                type: 'includes',
                value: '',
                label: '',
              } as ChallengeCheck);
            } else {
              onUpdate({
                type: 'dom',
                selector: '',
                expect: 'exists',
                value: '',
                label: '',
              } as ChallengeCheck);
            }
          }}
          className="rounded border border-border bg-surface px-2 py-1 text-xs font-medium"
        >
          <option value="includes">Code contains</option>
          <option value="dom">DOM has</option>
        </select>

        <input
          type="text"
          placeholder="Optional label"
          value={check.label ?? ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs"
        />

        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
          title="Remove check"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {check.type === 'includes' ? (
        <input
          type="text"
          placeholder="Substring, e.g. <h1> or .heading {"
          value={check.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-[11px]"
        />
      ) : (
        <div className="grid gap-2 md:grid-cols-3">
          <input
            type="text"
            placeholder="CSS selector, e.g. h1"
            value={check.selector}
            onChange={(e) => onUpdate({ selector: e.target.value })}
            className="rounded border border-border bg-surface px-2 py-1 font-mono text-[11px]"
          />
          <select
            value={check.expect}
            onChange={(e) =>
              onUpdate({
                expect: e.target.value as
                  | 'exists'
                  | 'textEquals'
                  | 'textMatches',
              })
            }
            className="rounded border border-border bg-surface px-2 py-1 text-xs"
          >
            <option value="exists">Exists</option>
            <option value="textEquals">Text equals</option>
            <option value="textMatches">Text matches (regex)</option>
          </select>
          {check.expect !== 'exists' && (
            <input
              type="text"
              placeholder={
                check.expect === 'textEquals'
                  ? 'Expected text'
                  : 'Regex source, e.g. ^Hello.*$'
              }
              value={check.value ?? ''}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className={cn(
                'rounded border border-border bg-surface px-2 py-1 font-mono text-[11px]'
              )}
            />
          )}
        </div>
      )}
    </div>
  );
};