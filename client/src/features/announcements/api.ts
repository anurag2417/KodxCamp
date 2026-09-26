import { api } from '@/shared/lib/api';

/**
 * Announcement audience. Mirrors the server's discriminated union.
 * The `kind` field determines whether `id` is present.
 */
export type AnnouncementAudience =
  | { kind: 'all' }
  | { kind: 'roadmap'; id: string }
  | { kind: 'course'; id: string }
  | { kind: 'cohort'; id: string }
  | { kind: 'class'; id: string };

export type AnnouncementAudienceKind = AnnouncementAudience['kind'];

export interface ApiAnnouncement {
  _id: string;
  title: string;
  body: string;
  audienceKind: AnnouncementAudienceKind;
  audienceId?: string;
  authorId: string;
  publishedAt: string;
  pinnedUntil?: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Author display fields, attached by the feed endpoint. Absent on
   * the author's own list, where they're redundant.
   */
  author?: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  pinnedUntil?: string;
}

export const announcementsApi = {
  /**
   * Every announcement the caller can see. Server resolves the
   * caller's audiences from their cohort memberships and course
   * enrollments.
   */
  list: async (): Promise<ApiAnnouncement[]> => {
    const { data } = await api.get('/announcements');
    return data.data;
  },

  /**
   * Announcements authored by the caller. Instructor/admin only.
   */
  mine: async (): Promise<ApiAnnouncement[]> => {
    const { data } = await api.get('/announcements/mine');
    return data.data;
  },

  create: async (
    input: CreateAnnouncementInput
  ): Promise<ApiAnnouncement> => {
    const { data } = await api.post('/announcements', input);
    return data.data;
  },

  remove: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/announcements/${id}`);
    return data.data;
  },
};