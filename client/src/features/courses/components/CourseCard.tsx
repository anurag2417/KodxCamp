import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
}) => (
  <Link to={`/courses/${course.slug}`} className="block">
    <Card className="group h-full p-5 transition-all hover:border-brand-500/60 hover:shadow-md">
      <div className="flex items-start justify-between">
        <Badge>{langLabel[course.language] ?? course.language}</Badge>
        <ArrowRight
          size={18}
          className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-500"
        />
      </div>

      <h3 className="mt-3 text-base font-semibold text-text-primary">
        {course.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-text-muted">
        {course.description}
      </p>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>
            {completedCount} / {course.totalLessons} lessons
          </span>
          <span>{progressPercent}%</span>
        </div>
      </div>
    </Card>
  </Link>
);
