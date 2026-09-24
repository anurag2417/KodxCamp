import { Link } from 'react-router-dom';
import { Settings2, BookOpen } from 'lucide-react';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/shared/store/auth.store';

export const Courses: React.FC = () => {
  const { courses, loading, error, reload } = useCourses();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const count = courses.length;

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Courses
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
              Learn by building real things.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-text-muted">
              Pick a course. Write real code. Ship real projects. No
              dashboards, no gamification - just the work.
            </p>

            {!loading && !error && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-sm font-medium text-brand-500">
                <BookOpen size={14} />
                <span className="tabular-nums">{count}</span>
                <span className="opacity-80">
                  {count === 1 ? 'course' : 'courses'} available
                </span>
              </div>
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

        {/* Content */}
        {loading && (
          <div className="flex justify-center py-24">
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
          <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};