import { useQuery } from '@tanstack/react-query';
import {
  progressApi,
  type ApiOverview,
  type ApiCourseProgress,
  type ApiDifficulty,
  type ApiHeatmapDay,
  type ApiWeeklyXp,
  type ApiActivity,
} from '@/features/progress/api';
import { queryKeys } from '@/shared/lib/queryKeys';

interface Bundle {
  overview: ApiOverview | null;
  courses: ApiCourseProgress[];
  difficulty: ApiDifficulty | null;
  weekly: ApiWeeklyXp[];
  heatmap: ApiHeatmapDay[];
  activity: ApiActivity[];
}

const EMPTY: Bundle = {
  overview: null,
  courses: [],
  difficulty: null,
  weekly: [],
  heatmap: [],
  activity: [],
};

export function useProgressOverview() {
  const query = useQuery({
    queryKey: queryKeys.progress.overview,
    queryFn: async (): Promise<Bundle> => {
      const [overview, courses, difficulty, weekly, heatmap, activity] =
        await Promise.all([
          progressApi.overview(),
          progressApi.perCourse(),
          progressApi.difficulty(),
          progressApi.weekly(12),
          progressApi.heatmap(365),
          progressApi.recentActivity(),
        ]);
      return { overview, courses, difficulty, weekly, heatmap, activity };
    },
  });

  const data = query.data ?? EMPTY;

  return {
    ...data,
    loading: query.isLoading,
    error: query.error ? 'Failed to load progress' : null,
    reload: query.refetch,
  };
}
