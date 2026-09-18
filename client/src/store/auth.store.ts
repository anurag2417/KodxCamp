import { create } from 'zustand';
import type { IUser } from '@kodxcamp/shared';
import { api } from '../lib/api';

type AuthUser = Omit<IUser, 'password'>;

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** True once the initial `fetchMe` on app boot has settled. */
  bootstrapped: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  bootstrapped: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // Server: ApiResponse.success(res, { user, accessToken })
      // → data = { success, message, data: { user, accessToken } }
      set({ user: data.data.user, bootstrapped: true });
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      set({ user: data.data.user, bootstrapped: true });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null });
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      // Server: ApiResponse.success(res, user) → data = { ..., data: user }
      set({ user: data.data });
    } catch {
      set({ user: null });
    } finally {
      set({ bootstrapped: true });
    }
  },

  clearUser: () => set({ user: null }),
}));