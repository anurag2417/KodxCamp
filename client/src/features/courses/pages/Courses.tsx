import { Link } from 'react-router-dom';
import { Settings2, BookOpen } from 'lucide-react';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/shared/store/auth.store';
import { cn } from '@/shared/lib/utils';

export const Courses: React.FC = () => {
  const { courses, loading, error, reload } = useCourses();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const count = courses.length;

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Courses</h1>
            <p className="mt-1 text-sm text-text-muted">
              Learn by doing - pick a course and start writing code.
            </p>
          </div>

          {!loading && !error && (
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5',
                'text-sm font-semibold text-brand-500'
              )}
              title={`${count} course${count === 1 ? '' : 's'} available`}
            >
              <BookOpen size={14} />
              <span className="tabular-nums">{count}</span>
              <span className="font-medium opacity-80">
                {count === 1 ? 'course' : 'courses'}
              </span>
            </span>
          )}
        </div>

        {isAdmin && (
          <Link to="/admin/courses">
            <Button variant="secondary">
              <Settings2 size={14} /> Manage courses
            </Button>
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <ErrorState
          title="Couldn't load courses"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && courses.length === 0 && (
        <p className="text-text-muted">
          No courses yet. Check back soon.
          {isAdmin && (
            <>
              {' '}
              <Link
                to="/admin/courses"
                className="text-brand-500 hover:underline"
              >
                Create the first one →
              </Link>
            </>
          )}
        </p>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
};