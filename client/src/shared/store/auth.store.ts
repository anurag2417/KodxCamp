import { create } from 'zustand';
import axios from 'axios';
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

  /**
   * Fetch the current user.
   *
   * Called once on app bootstrap, and again by callers who want a
   * fresh snapshot (e.g. after a role change).
   *
   * Error policy (CHANGED in Batch 3.3):
   *   - 401 or 403 → the session is genuinely gone. Sign out.
   *   - Anything else (5xx, network failure, timeout) → keep the
   *     current user state. A transient backend problem is not a
   *     reason to sign the user out; the next user action will
   *     retry against a healthy backend, and if the session was
   *     actually invalid, that action will surface a 401 which
   *     the axios interceptor handles.
   *
   * Previously, any error cleared the user. That meant a 500 on
   * /auth/me, or a flaky network, would silently log the user out
   * even though their cookie was still valid.
   */
  fetchMe: async () => {
    try {
      const user = await authApi.me();
      establishSession(set, user);
    } catch (err) {
      const status = axios.isAxiosError(err)
        ? err.response?.status
        : undefined;

      if (status === 401 || status === 403) {
        // Genuinely not signed in.
        set({ user: null });
      } else {
        // Network blip or server error. Keep whatever user we had
        // (usually null on first boot, or the cached user on a
        // refetch). Don't clear it.
        //
        // We deliberately do not retry here — the caller can call
        // fetchMe again if it wants. A retry loop inside the store
        // would fight the axios interceptor and complicate the
        // bootstrapped contract.
      }
    } finally {
      set({ bootstrapped: true });
    }
  },

  clearUser: () => set({ user: null }),
}));