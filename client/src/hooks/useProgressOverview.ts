import { useEffect, useState } from 'react';
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

export function useProgressOverview() {
  const [data, setData] = useState<Bundle>({
    overview: null,
    courses: [],
    difficulty: null,
    weekly: [],
    heatmap: [],
    activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (!cancelled) {
          setData({ overview, courses, difficulty, weekly, heatmap, activity });
        }
      } catch {
        if (!cancelled) setError('Failed to load progress');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading, error };
}