import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../lib/courses.api';
import { queryKeys } from '../lib/queryKeys';

export function useCourse(slug: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.courses.detail(slug ?? ''),
    queryFn: () => coursesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  return {
    course: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? 'Course not found' : null,
    reload: query.refetch,
  };
}