import { useEffect, useState } from 'react';
import { projectsApi, type ApiProjectSummary } from '../lib/projects.api';

export function useProjects() {
  const [projects, setProjects] = useState<ApiProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await projectsApi.list();
        if (!cancelled) setProjects(data);
      } catch {
        if (!cancelled) setError('Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, loading, error };
}