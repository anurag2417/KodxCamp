import { useCourses } from '@/features/courses/hooks/useCourses';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';

export const Courses: React.FC = () => {
  const { courses, loading, error, reload } = useCourses();

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Courses</h1>
        <p className="mt-1 text-sm text-text-muted">
          Learn by doing - pick a course and start writing code.
        </p>
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
        <p className="text-text-muted">No courses yet. Check back soon.</p>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
};
