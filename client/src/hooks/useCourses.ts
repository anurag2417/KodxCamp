import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../lib/courses.api';
import { queryKeys } from '../lib/queryKeys';

export function useCourses() {
  const query = useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => coursesApi.list(),
  });

  return {
    courses: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load courses' : null,
    reload: query.refetch,
  };
}