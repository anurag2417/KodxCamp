import { Link } from 'react-router-dom';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { CategoryBadge } from '@/features/projects/components/CategoryBadge';
import type { ApiProjectSummary } from '@/features/projects/api';

interface Props {
  project: ApiProjectSummary;
}

export const ProjectCard: React.FC<Props> = ({ project }) => (
  <Link to={`/projects/${project.slug}`} className="block">
    <Card className="group flex h-full flex-col p-5 transition-all hover:border-brand-500/60 hover:shadow-md">
      <div className="flex items-start justify-between">
        <CategoryBadge category={project.category} />
        {project.userStatus?.status === 'completed' && (
          <CheckCircle2 size={18} className="text-[var(--color-success)]" />
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold text-text-primary">
        {project.title}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-muted">
        {project.description}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {project.estimatedMinutes} min
        </span>
        <span className="text-brand-500 font-semibold">+{project.xpReward} XP</span>
      </div>

      {project.userStatus?.status === 'in_progress' && (
        <p className="mt-2 text-xs font-medium text-[var(--color-warning)]">
          In progress
        </p>
      )}
    </Card>
  </Link>
);
