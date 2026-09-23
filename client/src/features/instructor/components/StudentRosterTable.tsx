import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApiRosterRow } from '@/features/instructor/api';

interface Props {
  courseSlug: string;
  rows: ApiRosterRow[];
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.round(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.round(diffMo / 12)}y ago`;
}

export const StudentRosterTable: React.FC<Props> = ({ courseSlug, rows }) => {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm font-medium text-text-primary">
          No students have started this course yet.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          They'll appear here as soon as they complete their first lesson.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-secondary">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              Student
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              Progress
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
              Problems
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
              Achievements
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
              Last active
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.userId}
              className="transition-colors hover:bg-surface-secondary"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/instructor/courses/${courseSlug}/students/${row.userId}`}
                  className="flex items-center gap-3"
                >
                  {row.avatar ? (
                    <img
                      src={row.avatar}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                      {initials(row.name) || '?'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {row.name || '(no name)'}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {row.email}
                    </p>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        row.percentage === 100
                          ? 'bg-[var(--color-success)]'
                          : 'bg-brand-500'
                      )}
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-xs text-text-muted">
                    {row.percentage}% · {row.lessonsCompleted}/
                    {row.totalLessons}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-sm text-text-secondary">
                {row.problemsSolved}
              </td>
              <td className="px-4 py-3 text-right text-sm text-text-secondary">
                {row.achievements}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-text-muted">
                  <Clock size={11} />
                  {relativeTime(row.lastActiveAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};