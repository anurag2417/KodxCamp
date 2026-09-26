import { api } from '@/shared/lib/api';
import type {
  NotificationType,
  NotificationPreferenceKey,
} from '@kodxcamp/shared';

export type { NotificationType, NotificationPreferenceKey };

export interface ApiNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotificationPage {
  notifications: ApiNotification[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type ApiNotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

export const notificationsApi = {
  /**
   * The caller's notifications. `unreadOnly` narrows to unread rows.
   */
  list: async (opts: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiNotificationPage> => {
    const { data } = await api.get('/notifications', {
      params: {
        unread: opts.unreadOnly ? 'true' : undefined,
        page: opts.page,
        limit: opts.limit,
      },
    });
    return data.data;
  },

  /**
   * Just the count. Used by the bell badge — much lighter than
   * fetching the list when the count is all we need.
   */
  unreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count');
    return data.data.count;
  },

  markRead: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data;
  },

  markAllRead: async (): Promise<{ ok: boolean }> => {
    const { data } = await api.post('/notifications/mark-all-read');
    return data.data;
  },

  remove: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data.data;
  },

  getPreferences: async (): Promise<ApiNotificationPreferences> => {
    const { data } = await api.get('/notifications/preferences');
    return data.data;
  },

  updatePreferences: async (
    patch: Partial<ApiNotificationPreferences>
  ): Promise<ApiNotificationPreferences> => {
    const { data } = await api.patch('/notifications/preferences', patch);
    return data.data;
  },
};