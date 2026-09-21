import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/features/projects/api';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useProject(slug: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.projects.detail(slug ?? ''),
    queryFn: () => projectsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const data = query.data ?? { project: null, userProject: null };

  return {
    project: data.project,
    userProject: data.userProject,
    loading: query.isLoading,
    error: query.error ? 'Project not found' : null,
    reload: query.refetch,
    /** Local override for optimistic updates */
    setUserProject: (up: typeof data.userProject) => {
      queryClient.setQueryData(queryKeys.projects.detail(slug ?? ''), {
        ...data,
        userProject: up,
      });
    },
  };
}
