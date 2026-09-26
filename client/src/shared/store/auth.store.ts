import { create } from 'zustand';
import type { IUser } from '@kodxcamp/shared';
import { authApi } from '@/features/auth/api';
import { migrateGuestDrafts } from '@/shared/lib/draftMigration';

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

/**
 * Establish a session and run the guest → user draft migration.
 *
 * Every login path funnels through here: password login, Google
 * login, password-reset completion, invitation acceptance. Putting
 * the migration in one place means it happens once per
 * guest-to-signed-in transition, regardless of which form the user
 * came through.
 *
 * The migration is synchronous and runs before the state update, so
 * by the time any React component sees the new `user`, the drafts
 * are already keyed under the user's id. A component that reads
 * `problem:{userId}:…` on the next render will find the guest's
 * draft.
 */
function establishSession(
  set: (partial: Partial<AuthState>) => void,
  user: AuthUser,
) {
  migrateGuestDrafts(user._id);
  set({ user, bootstrapped: true });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  bootstrapped: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { user } = await authApi.login(email, password);
      establishSession(set, user);
    } finally {
      set({ loading: false });
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ loading: true });
    try {
      const { user } = await authApi.loginWithGoogle(idToken);
      establishSession(set, user);
    } finally {
      set({ loading: false });
    }
  },

  setSession: (user) => establishSession(set, user),

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
      // `fetchMe` also establishes a session — on a page reload with
      // a valid cookie, this is how the store learns who the user
      // is. Running the migration here too means drafts left over
      // from a prior guest session on this device are picked up
      // whenever the user comes back.
      establishSession(set, user);
    } catch {
      set({ user: null });
    } finally {
      set({ bootstrapped: true });
    }
  },

  clearUser: () => set({ user: null }),
}));