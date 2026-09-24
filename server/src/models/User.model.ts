import mongoose, { Schema, type Document } from 'mongoose';

export type UserRole = 'student' | 'instructor' | 'admin';

export type AuthProvider = 'email' | 'google' | 'both';

/**
 * Where a user is in the signup lifecycle.
 *
 *   pending_verification - created by email signup, has not yet
 *     verified their email via OTP.
 *   pending_profile - verified their email, has not yet set a name
 *     and password.
 *   active - fully set up; can log in.
 *   suspended - disabled by an admin. Login is refused.
 *
 * Google signup skips straight to `active` because Google has already
 * verified the email.
 */
export type AccountStatus =
  | 'pending_verification'
  | 'pending_profile'
  | 'active'
  | 'suspended';

export interface UserDocument extends Document {
  name: string;
  email: string;
  /** Optional - Google-only users have no password. */
  password?: string;
  role: UserRole;

  /** Set by the signup flow. Never reverts to false once true. */
  emailVerified: boolean;
  accountStatus: AccountStatus;
  authProvider: AuthProvider;
  /** Firebase UID for Google-linked accounts. */
  googleId?: string;

  avatar?: string;
  xp: number;
  streak: number;
  lastActiveAt: Date;
  lastActiveDay?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: false, trim: true, default: '' },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: false, select: false },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'] as UserRole[],
      default: 'student',
    },

    emailVerified: { type: Boolean, default: false, index: true },
    accountStatus: {
      type: String,
      enum: [
        'pending_verification',
        'pending_profile',
        'active',
        'suspended',
      ] as AccountStatus[],
      default: 'pending_verification',
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'both'] as AuthProvider[],
      default: 'email',
      index: true,
    },
    googleId: { type: String, index: true, sparse: true },

    avatar: { type: String },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    lastActiveDay: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', userSchema);