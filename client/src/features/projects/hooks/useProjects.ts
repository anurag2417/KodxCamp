import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/features/projects/api';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useProjects() {
  const query = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => projectsApi.list(),
  });

  return {
    projects: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load projects' : null,
    reload: query.refetch,
  };
}
