import { useCallback, useEffect, useState } from 'react';
import { projectsApi, type ApiProjectSummary } from '../lib/projects.api';

export function useProjects() {
  const [projects, setProjects] = useState<ApiProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list();
      setProjects(data);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { projects, loading, error, reload };
}