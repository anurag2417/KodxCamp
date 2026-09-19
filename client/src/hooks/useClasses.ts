import { useCallback, useEffect, useState } from 'react';
import { classesApi, type ApiClass } from '../lib/classes.api';

export function useClasses(scope: 'upcoming' | 'past' | 'all' = 'all') {
  const [classes, setClasses] = useState<ApiClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classesApi.list(scope);
      setClasses(data);
    } catch {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { classes, setClasses, loading, error, reload };
}