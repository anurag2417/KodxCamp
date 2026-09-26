import { useQuery } from '@tanstack/react-query';
import { roadmapsApi } from '@/features/roadmaps/api';
import { roadmapDetailKey } from './useRoadmaps';

export function useRoadmap(slug: string | undefined) {
  const query = useQuery({
    queryKey: roadmapDetailKey(slug ?? ''),
    queryFn: () => roadmapsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  return {
    roadmap: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? 'Roadmap not found' : null,
    reload: query.refetch,
  };
}