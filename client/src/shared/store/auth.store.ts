import { create } from 'zustand';
import type { IUser } from '@kodxcamp/shared';
import { authApi } from '@/features/auth/api';

type AuthUser = IUser;

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  bootstrapped: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  setSession: (user: AuthUser) => void;
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
      const { user } = await authApi.login(email, password);
      set({ user, bootstrapped: true });
    } finally {
      set({ loading: false });
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ loading: true });
    try {
      const { user } = await authApi.loginWithGoogle(idToken);
      set({ user, bootstrapped: true });
    } finally {
      set({ loading: false });
    }
  },

  setSession: (user) => set({ user, bootstrapped: true }),

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null });
    }
  },

  fetchMe: async () => {
    try {
      const user = await authApi.me();
      set({ user });
    } catch {
      set({ user: null });
    } finally {
      set({ bootstrapped: true });
    }
  },

  clearUser: () => set({ user: null }),
}));