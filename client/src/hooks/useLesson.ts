import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../lib/courses.api';
import { queryKeys } from '../lib/queryKeys';

export function useLesson(courseSlug?: string, lessonSlug?: string) {
  const query = useQuery({
    queryKey: queryKeys.courses.lesson(courseSlug ?? '', lessonSlug ?? ''),
    queryFn: () => coursesApi.getLesson(courseSlug!, lessonSlug!),
    enabled: !!courseSlug && !!lessonSlug,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? 'Lesson not found' : null,
    reload: query.refetch,
  };
}