import { useCallback, useEffect, useState } from 'react';
import {
  projectsApi,
  type ApiProjectFull,
  type ApiUserProject,
} from '../lib/projects.api';

export function useProject(slug: string | undefined) {
  const [project, setProject] = useState<ApiProjectFull | null>(null);
  const [userProject, setUserProject] = useState<ApiUserProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { project, userProject } = await projectsApi.getBySlug(slug);
      setProject(project);
      setUserProject(userProject);
    } catch {
      setError('Project not found');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { project, userProject, setUserProject, loading, error, reload };
}