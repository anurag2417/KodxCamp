import { useEffect, useState } from 'react';
import { achievementsApi, type ApiAchievement } from '../lib/achievements.api';

export function useAchievements() {
  const [achievements, setAchievements] = useState<ApiAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await achievementsApi.mine();
        if (!cancelled) setAchievements(data);
      } catch {
        if (!cancelled) setError('Failed to load achievements');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { achievements, loading, error };
}