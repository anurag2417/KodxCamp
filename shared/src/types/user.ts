export type UserRole = 'student' | 'instructor' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  xp: number;
  streak: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
}