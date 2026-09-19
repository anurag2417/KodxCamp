import { useCallback, useEffect, useState } from 'react';
import {
  progressApi,
  type ApiOverview,
  type ApiCourseProgress,
  type ApiDifficulty,
  type ApiHeatmapDay,
  type ApiWeeklyXp,
  type ApiActivity,
} from '../lib/progress.api';

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
  const [data, setData] = useState<Bundle>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, courses, difficulty, weekly, heatmap, activity] =
        await Promise.all([
          progressApi.overview(),
          progressApi.perCourse(),
          progressApi.difficulty(),
          progressApi.weekly(12),
          progressApi.heatmap(365),
          progressApi.recentActivity(),
        ]);
      setData({ overview, courses, difficulty, weekly, heatmap, activity });
    } catch {
      setError('Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...data, loading, error, reload };
}