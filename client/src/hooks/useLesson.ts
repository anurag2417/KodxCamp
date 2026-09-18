import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!courseSlug || !lessonSlug) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const result = await coursesApi.getLesson(courseSlug, lessonSlug);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError('Lesson not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseSlug, lessonSlug]);

  return { data, loading, error };
}