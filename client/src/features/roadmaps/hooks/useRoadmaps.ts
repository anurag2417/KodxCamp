import { useQuery } from '@tanstack/react-query';
import { roadmapsApi } from '@/features/roadmaps/api';

/**
 * React Query key for the public roadmap catalog.
 * Exported so other features can invalidate it after admin edits.
 */
export const ROADMAPS_QUERY_KEY = ['roadmaps', 'list'] as const;

/**
 * Query key factory for roadmap details.
 * Keyed by slug so each roadmap caches independently.
 */
export function roadmapDetailKey(slug: string) {
  return ['roadmaps', 'detail', slug] as const;
}

export function useRoadmaps() {
  const query = useQuery({
    queryKey: ROADMAPS_QUERY_KEY,
    queryFn: () => roadmapsApi.list(),
  });

  return {
    roadmaps: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load roadmaps' : null,
    reload: query.refetch,
  };
}