import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useCourse } from '@/features/courses/hooks/useCourse';
import { CourseQuiz } from '@/features/courses/components/CourseQuiz';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';

export const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { course, loading, error, reload } = useCourse(slug);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="w-full p-6 lg:p-8">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={16} /> Back to courses
        </Link>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load this course"
            message={error ?? 'Course not found'}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  const firstLesson = course.lessons[0];

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={16} /> Back to courses
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <Badge>{course.language}</Badge>
          <h1 className="mt-3 text-3xl font-bold text-text-primary">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {course.description}
          </p>
        </div>

        {firstLesson && (
          <Link to={`/courses/${course.slug}/lessons/${firstLesson.slug}`}>
            <Button size="lg">
              <PlayCircle size={18} />
              {course.lessons.length > 0 ? 'Start First Lesson' : 'Coming Soon'}
            </Button>
          </Link>
        )}
      </div>

      {/* Lessons grid */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Lessons ({course.lessons.length})
        </h2>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {course.lessons.map((lesson, idx) => (
            <Link
              key={lesson._id}
              to={`/courses/${course.slug}/lessons/${lesson.slug}`}
              className="block"
            >
              <Card className="group flex h-full items-center gap-4 p-4 transition-all hover:border-brand-500/60">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-tertiary font-bold text-brand-500">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-text-primary">
                    {lesson.title}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Lesson {lesson.order}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <CourseQuiz courseSlug={course.slug} />
    </div>
  );
};
