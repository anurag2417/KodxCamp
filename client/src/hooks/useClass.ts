import { useCallback, useEffect, useState } from 'react';
import {
  classesApi,
  type ApiClass,
  type ApiEnrollment,
} from '../lib/classes.api';

export function useClass(slug: string | undefined) {
  const [cls, setCls] = useState<ApiClass | null>(null);
  const [enrollment, setEnrollment] = useState<ApiEnrollment | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await classesApi.getBySlug(slug);
      setCls(data.class);
      setEnrollment(data.enrollment);
      setAttendeeCount(data.attendeeCount);
    } catch {
      setError('Class not found');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    cls,
    enrollment,
    setEnrollment,
    attendeeCount,
    loading,
    error,
    reload,
  };
}