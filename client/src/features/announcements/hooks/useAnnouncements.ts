import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  announcementsApi,
  type ApiAnnouncement,
  type CreateAnnouncementInput,
} from '@/features/announcements/api';

export const announcementsQueryKeys = {
  feed: ['announcements', 'feed'] as const,
  mine: ['announcements', 'mine'] as const,
};

/**
 * The signed-in user's feed. Returns announcements targeting any
 * audience they belong to, plus all `all`-scoped ones.
 */
export function useAnnouncementFeed() {
  const query = useQuery({
    queryKey: announcementsQueryKeys.feed,
    queryFn: () => announcementsApi.list(),
  });

  return {
    announcements: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load announcements' : null,
    reload: query.refetch,
  };
}

/**
 * The caller's own authored announcements. Instructor/admin only.
 */
export function useMyAnnouncements() {
  const query = useQuery({
    queryKey: announcementsQueryKeys.mine,
    queryFn: () => announcementsApi.mine(),
  });

  return {
    announcements: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load your announcements' : null,
    reload: query.refetch,
  };
}

/**
 * Mutation hooks. Both invalidate the relevant caches so the feed
 * and the author list stay in sync.
 */
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) =>
      announcementsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementsQueryKeys.feed });
      qc.invalidateQueries({ queryKey: announcementsQueryKeys.mine });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementsQueryKeys.feed });
      qc.invalidateQueries({ queryKey: announcementsQueryKeys.mine });
    },
  });
}

/**
 * Type re-export so components can import the shape from the hook
 * module if that's more convenient than importing from `api.ts`.
 */
export type { ApiAnnouncement };