import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Response interceptor: handle auth expiry globally
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    // Don't nuke the session on /auth/me - that call *determines* the session
    if (status === 401 && !url.includes('/auth/me')) {
      // Clear auth store lazily to avoid circular import at module load.
      // The dynamic import is intentional: api.ts is imported before
      // auth.store finishes evaluating (auth.store → authApi → api).
      // Using a dynamic import defers module resolution to after all
      // modules have initialised, breaking the cycle safely.
      // Rollup warns that the dynamic import won't split auth.store into
      // its own chunk (because it is also statically imported elsewhere),
      // but the behaviour is still correct.
      void import('@/shared/store/auth.store').then(({ useAuthStore }) => {
        useAuthStore.getState().clearUser();
      });

      // Redirect to /login if we're not already there
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/signup')
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
