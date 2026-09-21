import { useQuery, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '@/features/classes/api';
import { queryKeys } from '@/shared/lib/queryKeys';

type ClassesData = Awaited<ReturnType<typeof classesApi.list>>;

interface ClassesUpdater {
  (prev: ClassesData | undefined): ClassesData | undefined;
}

export function useClasses(scope: 'upcoming' | 'past' | 'all' = 'all') {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.classes.all(scope),
    queryFn: () => classesApi.list(scope),
  });

  return {
    classes: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load classes' : null,
    reload: query.refetch,
    /** Local mutation helper for the create-class form */
    setClasses: (updater: ClassesUpdater) => {
      queryClient.setQueryData<ClassesData>(queryKeys.classes.all(scope), (prev: ClassesData | undefined) =>
        updater((prev ?? []) as ClassesData)
      );
    },
  };
}
