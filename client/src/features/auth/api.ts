import { api } from '@/shared/lib/api';
import type { IUser } from '@kodxcamp/shared';

export type AuthUser = Omit<IUser, 'password'>;

export interface AuthSuccess {
  user: AuthUser;
  accessToken: string;
}

/**
 * Failure responses from `/auth/login` carry a machine-readable
 * `reason` so the client can route without guessing.
 */
export type LoginFailureReason =
  | 'email_unverified'
  | 'profile_incomplete'
  | 'account_suspended';

export interface LoginFailure {
  reason: LoginFailureReason;
  email?: string;
  setupToken?: string;
}

export const authApi = {
  async register(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/register', { email });
    return data.data;
  },

  async resendOtp(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data.data;
  },

  async verifyOtp(
    email: string,
    code: string
  ): Promise<{ setupToken: string }> {
    const { data } = await api.post('/auth/verify-otp', { email, code });
    return data.data;
  },

  async setPassword(input: {
    setupToken: string;
    name: string;
    password: string;
  }): Promise<AuthSuccess> {
    const { data } = await api.post('/auth/set-password', input);
    return data.data;
  },

  async login(email: string, password: string): Promise<AuthSuccess> {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data;
  },

  async loginWithGoogle(
    idToken: string
  ): Promise<AuthSuccess & { isNewUser: boolean }> {
    const { data } = await api.post('/auth/google', { idToken });
    return data.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data.data;
  },

  async resetPassword(
    token: string,
    password: string
  ): Promise<AuthSuccess> {
    const { data } = await api.post('/auth/reset-password', {
      token,
      password,
    });
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};