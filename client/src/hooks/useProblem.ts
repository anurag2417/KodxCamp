import { useCallback, useEffect, useState } from 'react';
import { problemsApi, type ApiProblemFull } from '../lib/problems.api';

export function useProblem(slug: string | undefined) {
  const [problem, setProblem] = useState<ApiProblemFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await problemsApi.getBySlug(slug);
      setProblem(data);
    } catch {
      setError('Problem not found');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { problem, loading, error, reload };
}