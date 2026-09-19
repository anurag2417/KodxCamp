import { useQuery } from '@tanstack/react-query';
import { problemsApi } from '../lib/problems.api';
import { queryKeys } from '../lib/queryKeys';

export function useProblem(slug: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.problems.detail(slug ?? ''),
    queryFn: () => problemsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  return {
    problem: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? 'Problem not found' : null,
    reload: query.refetch,
  };
}