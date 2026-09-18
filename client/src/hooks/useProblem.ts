import { useEffect, useState } from 'react';
import { problemsApi, type ApiProblemFull } from '../lib/problems.api';

export function useProblem(slug: string | undefined) {
  const [problem, setProblem] = useState<ApiProblemFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await problemsApi.getBySlug(slug);
        if (!cancelled) setProblem(data);
      } catch {
        if (!cancelled) setError('Problem not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { problem, loading, error };
}