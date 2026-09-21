import { Link } from 'react-router-dom';
import { Calendar, Users, Video } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { ClassStatusBadge } from '@/features/classes/components/ClassStatusBadge';
import type { ApiClass } from '@/features/classes/api';

interface Props {
  classItem: ApiClass;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const ClassCard: React.FC<Props> = ({ classItem }) => (
  <Link to={`/classes/${classItem.slug}`} className="block">
    <Card className="group flex h-full flex-col p-5 transition-all hover:border-brand-500/60 hover:shadow-md">
      <div className="flex items-start justify-between">
        <ClassStatusBadge status={classItem.status} />
        {classItem.enrolled && (
          <span className="text-xs font-medium text-brand-500">Enrolled</span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold text-text-primary">
        {classItem.title}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-muted">
        {classItem.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {formatDateTime(classItem.scheduledAt)}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} /> {classItem.instructorName}
        </span>
        {classItem.recording && (
          <span className="flex items-center gap-1 text-[var(--color-success)]">
            <Video size={12} /> Recording
          </span>
        )}
      </div>
    </Card>
  </Link>
);
