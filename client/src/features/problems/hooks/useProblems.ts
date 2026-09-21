import { useQuery } from '@tanstack/react-query';
import { problemsApi } from '@/features/problems/api';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useProblems() {
  const query = useQuery({
    queryKey: queryKeys.problems.all,
    queryFn: () => problemsApi.list(),
  });

  return {
    problems: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load problems' : null,
    reload: query.refetch,
  };
}
