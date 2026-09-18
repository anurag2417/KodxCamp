import { useEffect, useState } from 'react';
import { classesApi, type ApiClass } from '../lib/classes.api';

export function useClasses(scope: 'upcoming' | 'past' | 'all' = 'all') {
  const [classes, setClasses] = useState<ApiClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await classesApi.list(scope);
        if (!cancelled) setClasses(data);
      } catch {
        if (!cancelled) setError('Failed to load classes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  return { classes, setClasses, loading, error };
}