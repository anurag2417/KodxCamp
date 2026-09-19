import { useQuery } from '@tanstack/react-query';
import { achievementsApi } from '../lib/achievements.api';
import { queryKeys } from '../lib/queryKeys';

export function useAchievements() {
  const query = useQuery({
    queryKey: queryKeys.achievements.mine,
    queryFn: () => achievementsApi.mine(),
  });

  return {
    achievements: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load achievements' : null,
    reload: query.refetch,
  };
}