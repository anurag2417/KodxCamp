import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { DifficultyBadge } from '@/features/problems/components/DifficultyBadge';
import type { ApiProblemSummary } from '@/features/problems/api';

interface Props {
  problem: ApiProblemSummary;
}

export const ProblemCard: React.FC<Props> = ({ problem }) => (
  <Link to={`/practice/${problem.slug}`} className="block">
    <Card className="group flex h-full items-center justify-between gap-4 p-4 transition-all hover:border-brand-500/60">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {problem.solved && (
            <CheckCircle2 size={16} className="shrink-0 text-brand-500" />
          )}
          <span className="shrink-0 text-xs font-mono text-text-muted">
            {problem.number}.
          </span>
          <h3 className="line-clamp-1 text-sm font-semibold text-text-primary">
            {problem.title}
          </h3>
        </div>
        {problem.topics.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-text-muted">
            {problem.topics.join(' · ')}
          </p>
        )}
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
    </Card>
  </Link>
);
