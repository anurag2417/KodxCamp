import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ApiProblemTestCase } from '../../lib/problems.api';
import type { TestResult } from '../../lib/runner/testHarness';

interface Props {
  testCases: ApiProblemTestCase[];
  results?: TestResult[];
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

  // Auto-switch to result tab when results arrive
  const showingResult = !!results && results.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border-t border-border bg-surface',
        open ? 'h-full' : 'h-11'
      )}
    >
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface-secondary px-3">
        <div className="flex items-center gap-1">
          {showingResult && (
            <button
              onClick={() => setTab('result')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                tab === 'result'
                  ? 'bg-surface text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {accepted ? (
                  <CheckCircle2 size={12} className="text-[var(--color-success)]" />
                ) : (
                  <XCircle size={12} className="text-[var(--color-error)]" />
                )}
                Result
              </span>
            </button>
          )}
          <button
            onClick={() => setTab('testcase')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              tab === 'testcase' && !running
                ? 'bg-surface text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            Testcase
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1 text-text-muted hover:bg-surface-tertiary hover:text-text-secondary"
          title={open ? 'Collapse' : 'Expand'}
        >
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Body */}
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
      {/* Test case selector tabs */}
      <div className="mb-3 flex flex-wrap gap-1">
        {testCases.map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              i === activeIdx
                ? 'bg-surface-tertiary text-text-primary'
                : 'text-text-muted hover:bg-surface-secondary hover:text-text-secondary'
            )}
          >
            Case {i + 1}
          </button>
        ))}
      </div>

      <div className="space-y-3">
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
      </div>
    </div>
  );
};

const ResultView: React.FC<{
  results: TestResult[];
  accepted: boolean;
  totalRuntimeMs: number;
}> = ({ results, accepted, totalRuntimeMs }) => {
  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div>
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
        {results.map((r) => (
          <div
            key={r.index}
            className={cn(
              'rounded-lg border p-3 text-xs',
              r.passed
                ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
                : 'border-[var(--color-error)]/30 bg-[var(--color-error)]/5'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">
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
                {r.passed ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {r.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
            {!r.passed && (
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
          </div>
        ))}
      </div>
    </div>
  );
};