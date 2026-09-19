import { useCallback, useEffect, useState } from 'react';
import { coursesApi, type ApiCourse } from '../lib/courses.api';

export function useCourses() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coursesApi.list();
      setCourses(data);
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { courses, loading, error, reload };
}