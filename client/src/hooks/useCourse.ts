import { useCallback, useEffect, useState } from 'react';
import {
  coursesApi,
  type ApiCourse,
  type ApiLessonSummary,
} from '../lib/courses.api';

export function useCourse(slug: string | undefined) {
  const [course, setCourse] = useState<
    (ApiCourse & { lessons: ApiLessonSummary[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await coursesApi.getBySlug(slug);
      setCourse(data);
    } catch {
      setError('Course not found');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { course, loading, error, reload };
}