import { useCallback, useEffect, useState } from 'react';
import { problemsApi, type ApiProblemSummary } from '../lib/problems.api';

export function useProblems() {
  const [problems, setProblems] = useState<ApiProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await problemsApi.list();
      setProblems(data);
    } catch {
      setError('Failed to load problems');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { problems, loading, error, reload };
}