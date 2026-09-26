import { api } from '@/shared/lib/api';

export type MediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'other';

export interface ApiMediaAsset {
  _id: string;
  ownerId: string;
  kind: MediaKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMediaPage {
  assets: ApiMediaAsset[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const mediaApi = {
  /**
   * Upload a file. Uses `multipart/form-data`.
   *
   * The server's multer middleware expects the file under the
   * `file` field. We set the Content-Type header explicitly to
   * `multipart/form-data` so axios does not send a JSON body — the
   * browser fills in the boundary.
   */
  upload: async (file: File): Promise<ApiMediaAsset> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  list: async (opts: {
    scope?: 'mine' | 'all';
    kind?: MediaKind;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiMediaPage> => {
    const { data } = await api.get('/media', { params: opts });
    return data.data;
  },

  get: async (id: string): Promise<ApiMediaAsset> => {
    const { data } = await api.get(`/media/${id}`);
    return data.data;
  },

  remove: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/media/${id}`);
    return data.data;
  },
};