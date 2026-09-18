import { useEffect, useState } from 'react';
import { coursesApi, type ApiCourse, type ApiLessonSummary } from '../lib/courses.api';

export function useCourse(slug: string | undefined) {
  const [course, setCourse] = useState<
    (ApiCourse & { lessons: ApiLessonSummary[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await coursesApi.getBySlug(slug);
        if (!cancelled) setCourse(data);
      } catch {
        if (!cancelled) setError('Course not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { course, loading, error };
}