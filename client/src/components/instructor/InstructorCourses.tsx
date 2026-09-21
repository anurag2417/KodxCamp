import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { instructorApi } from '../../lib/instructor.api';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';

export const InstructorCourses: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const query = useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: () => instructorApi.listMyCourses(),
  });

  if (query.isLoading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="w-full p-6 lg:p-8">
        <ErrorState
          title="Couldn't load your courses"
          message="Try again in a moment."
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  const courses = query.data ?? [];

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">My Courses</h1>
          <p className="mt-1 text-sm text-text-muted">
            {isAdmin
              ? 'All courses on the platform'
              : 'Courses you help build and teach'}
          </p>
        </div>
        {isAdmin && (
          <Link to="/instructor/courses/new">
            <Button>
              <Plus size={16} /> New Course
            </Button>
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">
          {isAdmin
            ? 'No courses yet. Create the first one.'
            : 'You are not on any course team yet. Ask an admin to add you.'}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c._id} to={`/instructor/courses/${c.slug}`}>
              <Card className="flex h-full flex-col p-5 transition-all hover:border-brand-500/60">
                <div className="flex items-start justify-between">
                  <Badge>{c.language}</Badge>
                  {c.published ? (
                    <span
                      className="flex items-center gap-1 text-xs text-[var(--color-success)]"
                      title="Published"
                    >
                      <Eye size={12} /> Live
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 text-xs text-text-muted"
                      title="Draft"
                    >
                      <EyeOff size={12} /> Draft
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  {c.title}
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-muted">
                  {c.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                  <span>{c.totalLessons} lessons</span>
                  {c.members.length > 0 && (
                    <span>{c.members.length + 1} on team</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};