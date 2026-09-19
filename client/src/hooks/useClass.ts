import { useQuery, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '../lib/classes.api';
import { queryKeys } from '../lib/queryKeys';

export function useClass(slug: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.classes.detail(slug ?? ''),
    queryFn: () => classesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const data = query.data ?? {
    class: null,
    enrollment: null,
    attendeeCount: 0,
  };

  return {
    cls: data.class,
    enrollment: data.enrollment,
    attendeeCount: data.attendeeCount,
    loading: query.isLoading,
    error: query.error ? 'Class not found' : null,
    reload: query.refetch,
    /** Local override for optimistic enrollment updates */
    setEnrollment: (enrollment: typeof data.enrollment) => {
      queryClient.setQueryData(queryKeys.classes.detail(slug ?? ''), {
        ...data,
        enrollment,
      });
    },
  };
}