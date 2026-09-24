import { useState } from 'react';
import { Lock } from 'lucide-react';
import { DifficultyBadge } from '@/features/problems/components/DifficultyBadge';
import { cn } from '@/shared/lib/utils';
import type { ApiProblemFull, ApiSubmission } from '@/features/problems/api';
import { SubmissionsList } from '@/features/problems/components/SubmissionsList';

interface Props {
  problem: ApiProblemFull;
  submissions: ApiSubmission[];
}

type Tab = 'description' | 'submissions';

export const ProblemPanel: React.FC<Props> = ({ problem, submissions }) => {
  const [tab, setTab] = useState<Tab>('description');
  const hiddenCount = problem.testCases.filter((tc) => tc.isHidden).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 gap-1 border-b border-border bg-surface px-2">
        {(['description', 'submissions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative px-3 py-2.5 text-xs font-medium capitalize transition-colors',
              tab === t
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {t === 'submissions' ? `Submissions (${submissions.length})` : t}
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'description' ? (
          <DescriptionView problem={problem} hiddenCount={hiddenCount} />
        ) : (
          <SubmissionsList submissions={submissions} />
        )}
      </div>
    </div>
  );
};

const DescriptionView: React.FC<{
  problem: ApiProblemFull;
  hiddenCount: number;
}> = ({ problem, hiddenCount }) => (
  <>
    <h1 className="text-xl font-bold text-text-primary">
      <span className="text-text-muted">{problem.number}.</span> {problem.title}
    </h1>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      <DifficultyBadge difficulty={problem.difficulty} />
      {problem.solved && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
          ✓ Solved
        </span>
      )}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
          <Lock size={10} />
          {hiddenCount} hidden test{hiddenCount === 1 ? '' : 's'}
        </span>
      )}
    </div>

    {problem.topics.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {problem.topics.map((t) => (
          <span
            key={t}
            className="rounded-full bg-surface-tertiary px-2.5 py-0.5 text-xs text-text-muted"
          >
            {t}
          </span>
        ))}
      </div>
    )}

    <div className="prose prose-sm mt-5 max-w-none whitespace-pre-wrap text-sm text-text-secondary">
      {problem.statement}
    </div>

    <div className="mt-6 rounded-lg border border-border bg-surface-secondary p-4 text-xs text-text-secondary">
      <p className="font-semibold text-text-primary">Implementation</p>
      <p className="mt-1">
        Define the function{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-brand-500">
          {problem.functionName}
        </code>{' '}
        {problem.outputMode === 'return'
          ? '- return the result. The platform compares your return value against the expected output.'
          : '- print the result. The platform compares your stdout against the expected output.'}
      </p>
      {hiddenCount > 0 && (
        <p className="mt-3 text-text-muted">
          {hiddenCount} hidden test{hiddenCount === 1 ? '' : 's'} will run when
          you click Run or Submit. Their inputs and expected outputs are not
          shown while you work, but their pass/fail counts toward your verdict.
        </p>
      )}
    </div>
  </>
);