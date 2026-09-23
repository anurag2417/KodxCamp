import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApiSubmission } from '@/features/problems/api';

interface Props {
  submissions: ApiSubmission[];
}

const statusLabel: Record<ApiSubmission['status'], string> = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  runtime_error: 'Runtime Error',
  compile_error: 'Compile Error',
};

export const SubmissionsList: React.FC<Props> = ({ submissions }) => {
  if (submissions.length === 0) {
    return <p className="text-xs text-text-muted">No submissions yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {submissions.map((s) => {
        const ok = s.status === 'accepted';

        return (
          <div
            key={s._id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              {ok ? (
                <CheckCircle2
                  size={14}
                  className="text-[var(--color-success)]"
                />
              ) : (
                <XCircle size={14} className="text-[var(--color-error)]" />
              )}
              <span
                className={cn(
                  'font-medium',
                  ok
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-error)]'
                )}
              >
                {statusLabel[s.status]}
              </span>
              <span className="text-text-muted">
                · {s.language} · {s.passedTests}/{s.totalTests}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              {s.runtimeMs != null && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {s.runtimeMs}ms
                </span>
              )}
              <span>{new Date(s.createdAt).toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};