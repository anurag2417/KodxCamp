import mongoose, { Schema, type Document } from 'mongoose';

export type UserRole = 'student' | 'instructor' | 'admin';

export type AuthProvider = 'email' | 'google' | 'both';

/**
 * Global permission set. Values must match `GLOBAL_PERMISSIONS` in
 * `shared/src/types/permissions.ts`.
 */
export type GlobalPermission =
  | 'problem_author'
  | 'project_author'
  | 'course_author'
  | 'class_coordinator';

/**
 * Where a user is in the signup lifecycle.
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
  /**
   * Global permission set. Independent of `role`. `admin` implicitly
   * has every permission; the check helper in `permissions.service.ts`
   * short-circuits admins.
   *
   * Defaults to `[]` so a newly created user (or one from before the
   * Batch 2 rollout) has no elevated permissions.
   */
  permissions: GlobalPermission[];

  emailVerified: boolean;
  accountStatus: AccountStatus;
  authProvider: AuthProvider;
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
    permissions: {
      type: [String],
      enum: [
        'problem_author',
        'project_author',
        'course_author',
        'class_coordinator',
      ] as GlobalPermission[],
      default: [],
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