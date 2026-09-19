import { useCallback, useEffect, useState } from 'react';
import {
  coursesApi,
  type ApiCourse,
  type ApiLessonFull,
} from '../lib/courses.api';

export function useLesson(courseSlug?: string, lessonSlug?: string) {
  const [data, setData] = useState<{
    course: ApiCourse;
    lesson: ApiLessonFull;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!courseSlug || !lessonSlug) return;
    setLoading(true);
    setError(null);
    try {
      const result = await coursesApi.getLesson(courseSlug, lessonSlug);
      setData(result);
    } catch {
      setError('Lesson not found');
    } finally {
      setLoading(false);
    }
  }, [courseSlug, lessonSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}