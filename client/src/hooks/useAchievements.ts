import { useCallback, useEffect, useState } from 'react';
import { achievementsApi, type ApiAchievement } from '../lib/achievements.api';

export function useAchievements() {
  const [achievements, setAchievements] = useState<ApiAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await achievementsApi.mine();
      setAchievements(data);
    } catch {
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { achievements, loading, error, reload };
}