import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  notificationsApi,
  type ApiNotificationPage,
  type ApiNotificationPreferences,
} from '@/features/notifications/api';

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  list: (unreadOnly: boolean) =>
    ['notifications', 'list', unreadOnly ? 'unread' : 'all'] as const,
  preferences: ['notifications', 'preferences'] as const,
};

/**
 * Unread count for the bell badge.
 *
 * Polls every 60 seconds and refetches on window focus. That's the
 * right interval: fast enough that a user who leaves a tab open for
 * a while sees the badge update, slow enough that we're not hammering
 * the server with a count query on every render. The query is one
 * `countDocuments` against an index.
 */
export function useUnreadCount() {
  const query = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  return {
    count: query.data ?? 0,
    loading: query.isLoading,
  };
}

/**
 * Paginated list. The bell dropdown asks for `unreadOnly: true,
 * limit: 5`. The /notifications page asks for the full page.
 */
export function useNotifications(opts: {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
  enabled?: boolean;
} = {}) {
  const unreadOnly = opts.unreadOnly ?? false;
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 30;

  const query = useQuery<ApiNotificationPage>({
    queryKey: [...notificationKeys.list(unreadOnly), page, limit],
    queryFn: () => notificationsApi.list({ unreadOnly, page, limit }),
    enabled: opts.enabled ?? true,
    staleTime: 30_000,
  });

  return {
    notifications: query.data?.notifications ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pages: query.data?.pages ?? 1,
    loading: query.isLoading,
    error: query.error ? 'Failed to load notifications' : null,
    reload: query.refetch,
  };
}

/**
 * Mark one notification read. Optimistic — the bell badge drops the
 * instant the user clicks. If the mutation fails, the invalidate
 * corrects it on the next refetch.
 */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async () => {
      // Optimistically decrement the badge.
      await qc.cancelQueries({ queryKey: notificationKeys.unreadCount });
      const previous = qc.getQueryData<number>(notificationKeys.unreadCount);
      if (typeof previous === 'number' && previous > 0) {
        qc.setQueryData(notificationKeys.unreadCount, previous - 1);
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx && typeof ctx.previous === 'number') {
        qc.setQueryData(notificationKeys.unreadCount, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.unreadCount });
      const previous = qc.getQueryData<number>(notificationKeys.unreadCount);
      qc.setQueryData(notificationKeys.unreadCount, 0);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx && typeof ctx.previous === 'number') {
        qc.setQueryData(notificationKeys.unreadCount, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useNotificationPreferences() {
  const query = useQuery<ApiNotificationPreferences>({
    queryKey: notificationKeys.preferences,
    queryFn: () => notificationsApi.getPreferences(),
  });

  return {
    preferences: query.data ?? null,
    loading: query.isLoading,
  };
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ApiNotificationPreferences>) =>
      notificationsApi.updatePreferences(patch),
    onSuccess: (fresh) => {
      qc.setQueryData(notificationKeys.preferences, fresh);
    },
  });
}