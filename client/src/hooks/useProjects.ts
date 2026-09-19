import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../lib/projects.api';
import { queryKeys } from '../lib/queryKeys';

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