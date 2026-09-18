import { useEffect, useState } from 'react';
import { problemsApi, type ApiProblemSummary } from '../lib/problems.api';

export function useProblems() {
  const [problems, setProblems] = useState<ApiProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await problemsApi.list();
        if (!cancelled) setProblems(data);
      } catch {
        if (!cancelled) setError('Failed to load problems');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { problems, loading, error };
}