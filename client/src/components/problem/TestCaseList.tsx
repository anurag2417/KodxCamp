import { CheckCircle2, XCircle, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ApiProblemTestCase } from '../../lib/problems.api';

interface Props {
  testCases: ApiProblemTestCase[];
  results?: { passed: boolean; isHidden: boolean }[];
}

export const TestCaseList: React.FC<Props> = ({ testCases, results }) => (
  <div className="flex flex-col gap-2">
    {testCases.map((tc, i) => {
      const result = results?.[i];
      const passed = result?.passed;

      return (
        <div
          key={i}
          className={cn(
            'rounded-lg border bg-surface p-3 text-xs',
            result
              ? passed
                ? 'border-[var(--color-success)]/40'
                : 'border-[var(--color-error)]/40'
              : 'border-border'
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tc.isHidden ? (
                <Lock size={12} className="text-text-muted" />
              ) : null}
              <span className="font-semibold text-text-primary">
                Test {i + 1}
                {tc.isHidden ? ' (hidden)' : ''}
              </span>
            </div>
            {result && (
              <span
                className={cn(
                  'flex items-center gap-1 font-medium',
                  passed ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                )}
              >
                {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {passed ? 'Passed' : 'Failed'}
              </span>
            )}
          </div>

          {!tc.isHidden && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-text-muted">Input</div>
                <code className="mt-0.5 block break-all font-mono text-text-primary">
                  {tc.input || '(none)'}
                </code>
              </div>
              <div>
                <div className="text-text-muted">Expected</div>
                <code className="mt-0.5 block break-all font-mono text-text-primary">
                  {tc.expectedOutput}
                </code>
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);