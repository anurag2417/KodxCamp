import { useEffect, useState } from 'react';
import { coursesApi, type ApiCourse } from '../lib/courses.api';

export function useCourses() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await coursesApi.list();
        if (!cancelled) setCourses(data);
      } catch (e) {
        if (!cancelled) setError('Failed to load courses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, loading, error };
}