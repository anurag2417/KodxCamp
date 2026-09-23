import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApiProblemTestCase } from '@/features/problems/api';
import type { VisibleTestResult } from '@/shared/runner/testHarness';

interface Props {
  testCases: ApiProblemTestCase[];
  results?: VisibleTestResult[];
  running?: boolean;
  accepted?: boolean;
  totalRuntimeMs?: number;
}

export const TestPanel: React.FC<Props> = ({
  testCases,
  results,
  running,
  accepted,
  totalRuntimeMs,
}) => {
  const [tab, setTab] = useState<'testcase' | 'result'>('testcase');
  const [activeIdx, setActiveIdx] = useState(0);
  const [open, setOpen] = useState(true);

  const showingResult = !!results && results.length > 0;

  useEffect(() => {
    if (showingResult) setTab('result');
  }, [showingResult]);

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border-t border-border bg-surface transition-[height] duration-200',
        open ? 'h-full' : 'h-11'
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface-secondary px-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('testcase')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium panel-transition',
              tab === 'testcase'
                ? 'bg-surface text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            Testcase
          </button>
          {showingResult && (
            <button
              onClick={() => setTab('result')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium panel-transition',
                tab === 'result'
                  ? 'bg-surface text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {accepted ? (
                  <CheckCircle2
                    size={12}
                    className="text-[var(--color-success)]"
                  />
                ) : (
                  <XCircle size={12} className="text-[var(--color-error)]" />
                )}
                Result
              </span>
            </button>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-tertiary hover:text-text-secondary"
          title={open ? 'Collapse' : 'Expand'}
        >
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {open && (
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'result' && results ? (
            <ResultView
              results={results}
              accepted={!!accepted}
              totalRuntimeMs={totalRuntimeMs ?? 0}
            />
          ) : (
            <TestCaseView
              testCases={testCases}
              activeIdx={activeIdx}
              onChange={setActiveIdx}
            />
          )}
        </div>
      )}
    </div>
  );
};

const TestCaseView: React.FC<{
  testCases: ApiProblemTestCase[];
  activeIdx: number;
  onChange: (idx: number) => void;
}> = ({ testCases, activeIdx, onChange }) => {
  const tc = testCases[activeIdx];
  if (!tc) {
    return <p className="text-xs text-text-muted">No test cases.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1">
        {testCases.map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium panel-transition',
              i === activeIdx
                ? 'bg-surface-tertiary text-text-primary'
                : 'text-text-muted hover:bg-surface-secondary hover:text-text-secondary'
            )}
          >
            Case {i + 1}
            {testCases[i].isHidden && <Lock size={10} />}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tc.isHidden ? (
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <Lock size={12} /> Hidden test
            </p>
            <p className="mt-2 text-xs text-text-muted">
              The input and expected output are hidden while you work. This
              test still runs when you click Run or Submit, and its result
              counts toward your verdict.
            </p>
          </div>
        ) : (
          <>
            {tc.input && (
              <div>
                <p className="mb-1 text-xs font-semibold text-text-secondary">
                  Input
                </p>
                <pre className="rounded-lg bg-surface-secondary px-3 py-2 font-mono text-xs text-text-primary">
                  {tc.input}
                </pre>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold text-text-secondary">
                Expected Output
              </p>
              <pre className="rounded-lg bg-surface-secondary px-3 py-2 font-mono text-xs text-text-primary">
                {tc.expectedOutput}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ResultView: React.FC<{
  results: VisibleTestResult[];
  accepted: boolean;
  totalRuntimeMs: number;
}> = ({ results, accepted, totalRuntimeMs }) => {
  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {accepted ? (
        <div className="mb-4 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-3">
          <p className="text-sm font-bold text-[var(--color-success)]">
            Accepted
          </p>
          <p className="mt-1 flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} /> {totalRuntimeMs}ms
            </span>
            <span>
              {passedCount}/{results.length} tests passed
            </span>
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-3">
          <p className="text-sm font-bold text-[var(--color-error)]">
            Wrong Answer
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {passedCount}/{results.length} tests passed
          </p>
        </div>
      )}

      <div className="space-y-2">
        {results.map((r, i) => (
          <ResultRow key={r.index} r={r} i={i} />
        ))}
      </div>
    </div>
  );
};

const ResultRow: React.FC<{ r: VisibleTestResult; i: number }> = ({ r, i }) => {
  const hidden = Boolean(r.isHidden);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-xs opacity-0 animate-in fade-in slide-in-from-bottom-1',
        r.passed
          ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
          : 'border-[var(--color-error)]/30 bg-[var(--color-error)]/5'
      )}
      style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
          {hidden && <Lock size={11} className="text-text-muted" />}
          Test {r.index + 1}
        </span>
        <span
          className={cn(
            'flex items-center gap-1 font-medium',
            r.passed
              ? 'text-[var(--color-success)]'
              : 'text-[var(--color-error)]'
          )}
        >
          {r.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {r.passed ? 'Passed' : 'Failed'}
        </span>
      </div>
      {!r.passed && !hidden && (
        <div className="mt-2 space-y-1">
          {r.stderr ? (
            <pre className="whitespace-pre-wrap font-mono text-[10px] text-[var(--color-error)]">
              {r.stderr}
            </pre>
          ) : (
            <div>
              <span className="text-text-muted">Got: </span>
              <span className="font-mono text-text-primary">
                {r.actualOutput || '(no output)'}
              </span>
            </div>
          )}
        </div>
      )}
      {!r.passed && hidden && (
        <p className="mt-2 text-[10px] text-text-muted">
          Hidden test failed. Input and expected output are not shown.
        </p>
      )}
    </div>
  );
};