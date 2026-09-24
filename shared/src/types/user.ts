import type { GlobalPermission } from './permissions.js';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  /**
   * Global permission set. Independent of `role`. `admin` implicitly
   * has every permission; non-admins only get the explicit ones.
   */
  permissions: GlobalPermission[];
  emailVerified: boolean;
  accountStatus:
    | 'pending_verification'
    | 'pending_profile'
    | 'active'
    | 'suspended';
  authProvider: 'email' | 'google' | 'both';
  googleId?: string;
  avatar?: string;
  xp: number;
  streak: number;
  lastActiveAt: Date;
  lastActiveDay?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
}