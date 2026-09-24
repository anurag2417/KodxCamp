import { useQuery } from '@tanstack/react-query';
import { problemsApi, type ProblemTier } from '@/features/problems/api';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useProblems(tier?: ProblemTier) {
  const query = useQuery({
    queryKey: [...queryKeys.problems.all, tier ?? 'all'],
    queryFn: () => problemsApi.list(tier),
  });

  return {
    problems: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load problems' : null,
    reload: query.refetch,
  };
}