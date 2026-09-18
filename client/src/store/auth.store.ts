import { create } from 'zustand';
import type { IUser } from '@kodxcamp/shared';
import { api } from '../lib/api';

interface AuthState {
  user: Omit<IUser, 'password'> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      set({ user: data.data.user });
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      set({ user: data.data.user });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data });
    } catch {
      set({ user: null });
    }
  },
}));