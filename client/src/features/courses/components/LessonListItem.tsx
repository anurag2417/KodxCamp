import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApiLessonSummary } from '@/features/courses/api';

interface Props {
  courseSlug: string;
  lesson: ApiLessonSummary;
  isCompleted: boolean;
  isActive: boolean;
}

export const LessonListItem: React.FC<Props> = ({
  courseSlug,
  lesson,
  isCompleted,
  isActive,
}) => (
  <Link
    to={`/courses/${courseSlug}/lessons/${lesson.slug}`}
    className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-surface-tertiary text-brand-700 dark:bg-surface-tertiary dark:text-white'
        : 'text-text-secondary hover:bg-surface-secondary'
    )}
  >
    {isCompleted ? (
      <CheckCircle2 size={16} className="text-brand-500" />
    ) : (
      <Circle size={16} className="text-text-muted" />
    )}
    <span className="line-clamp-1">{lesson.title}</span>
  </Link>
);
