import { Link } from 'react-router-dom';
import { ArrowRight, Gift, IndianRupee } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import type { ApiCourse } from '@/features/courses/api';

const langLabel: Record<string, string> = {
  'html-css': 'HTML & CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  sql: 'SQL',
  react: 'React',
  tailwind: 'Tailwind',
  'dsa-python': 'DSA · Python',
  'dsa-javascript': 'DSA · JavaScript',
};

interface Props {
  course: ApiCourse;
  progressPercent?: number;
  completedCount?: number;
}

export const CourseCard: React.FC<Props> = ({
  course,
  progressPercent = 0,
  completedCount = 0,
}) => {
  const showPrice =
    !course.isFree && course.price && course.price > 0
      ? `₹${Math.round(course.price / 100)}`
      : null;

  return (
    <Link to={`/courses/${course.slug}`} className="block">
      <Card className="group flex h-full flex-col p-6 transition-all hover:border-brand-500/60 hover:shadow-md">
        {/* Top row: language + price + arrow */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{langLabel[course.language] ?? course.language}</Badge>
          </div>

          <div className="flex items-center gap-2">
            {course.isFree ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-success)]">
                <Gift size={11} /> Free
              </span>
            ) : showPrice ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-500">
                <IndianRupee size={11} /> {showPrice.slice(1)}
              </span>
            ) : null}
            <ArrowRight
              size={18}
              className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-500"
            />
          </div>
        </div>

        {/* Title + description */}
        <h3 className="mt-4 text-lg font-semibold leading-snug text-text-primary">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-text-muted">
          {course.description}
        </p>

        {/* Progress */}
        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>
              {completedCount} / {course.totalLessons} lessons
            </span>
            <span className="font-semibold text-text-secondary">
              {progressPercent}%
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};