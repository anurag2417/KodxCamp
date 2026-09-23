import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import {
  instructorApi,
  type ApiInstructorCourse,
  type ApiRosterPage,
  type RosterSort,
} from '@/features/instructor/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { StudentRosterTable } from '@/features/instructor/components/StudentRosterTable';
import { cn } from '@/shared/lib/utils';

const SORT_OPTIONS: { value: RosterSort; label: string }[] = [
  { value: 'recent', label: 'Recently active' },
  { value: 'progress', label: 'Progress' },
  { value: 'name', label: 'Name' },
  { value: 'joined', label: 'Recently joined' },
];

export const InstructorStudents: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const courseSlug = searchParams.get('course') ?? '';
  const search = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') ?? 'recent') as RosterSort;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));

  const [courses, setCourses] = useState<ApiInstructorCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [roster, setRoster] = useState<ApiRosterPage | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(search);

  // Load the instructor's courses once.
  useEffect(() => {
    let cancelled = false;
    setCoursesLoading(true);
    instructorApi
      .listMyCourses()
      .then((rows) => {
        if (cancelled) return;
        setCourses(rows);
        // Auto-select the first course if none is chosen.
        if (!courseSlug && rows.length > 0) {
          const next = new URLSearchParams(searchParams);
          next.set('course', rows[0].slug);
          setSearchParams(next, { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) setCoursesError('Failed to load courses.');
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the roster whenever course / search / sort / page changes.
  useEffect(() => {
    if (!courseSlug) return;
    let cancelled = false;
    setRosterLoading(true);
    setRosterError(null);
    instructorApi
      .listStudents(courseSlug, { search, sort, page, limit: 25 })
      .then((data) => {
        if (!cancelled) setRoster(data);
      })
      .catch(() => {
        if (!cancelled) setRosterError('Failed to load the roster.');
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug, search, sort, page]);

  // Debounce the search input.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (searchInput === search) return;
      const next = new URLSearchParams(searchParams);
      if (searchInput) next.set('q', searchInput);
      else next.delete('q');
      next.set('page', '1');
      setSearchParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.slug === courseSlug),
    [courses, courseSlug]
  );

  if (coursesLoading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (coursesError) {
    return (
      <div className="w-full p-6 lg:p-8">
        <ErrorState
          title="Couldn't load your courses"
          message={coursesError}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="w-full p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-text-primary">Students</h1>
        <p className="mt-2 text-sm text-text-muted">
          You don't have any courses yet.{' '}
          <Link to="/instructor" className="text-brand-500 hover:underline">
            Create one
          </Link>{' '}
          to start tracking students.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Students</h1>
          <p className="mt-1 text-sm text-text-muted">
            {selectedCourse
              ? `${roster?.total ?? 0} student${roster?.total === 1 ? '' : 's'} in ${selectedCourse.title}`
              : 'Pick a course to see its students.'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[200px] items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <BookOpen size={14} className="shrink-0 text-text-muted" />
          <select
            value={courseSlug}
            onChange={(e) => {
              const next = new URLSearchParams();
              next.set('course', e.target.value);
              setSearchParams(next, { replace: true });
            }}
            className="w-full border-0 bg-transparent text-sm text-text-primary focus:outline-none"
          >
            {courses.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            next.set('sort', e.target.value);
            next.set('page', '1');
            setSearchParams(next, { replace: true });
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Roster */}
      {rosterLoading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {rosterError && (
        <ErrorState
          title="Couldn't load the roster"
          message={rosterError}
          onRetry={() => window.location.reload()}
        />
      )}

      {!rosterLoading && !rosterError && roster && (
        <>
          <StudentRosterTable courseSlug={courseSlug} rows={roster.students} />

          {roster.pages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm text-text-muted">
              <span>
                Page {roster.page} of {roster.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('page', String(Math.max(1, roster.page - 1)));
                    setSearchParams(next, { replace: true });
                  }}
                  disabled={roster.page <= 1}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 transition-colors',
                    roster.page <= 1
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-surface-secondary'
                  )}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set(
                      'page',
                      String(Math.min(roster.pages, roster.page + 1))
                    );
                    setSearchParams(next, { replace: true });
                  }}
                  disabled={roster.page >= roster.pages}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 transition-colors',
                    roster.page >= roster.pages
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-surface-secondary'
                  )}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};