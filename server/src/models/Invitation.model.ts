import mongoose, { Schema, type Document } from 'mongoose';

/**
 * The role an invitee will have on the course team once they accept.
 *
 * Values must match `COURSE_TEAM_ROLES` in
 * `shared/src/types/permissions.ts`. Do NOT reintroduce the legacy
 * `author` / `reviewer` roles — every reader downstream (permissions
 * service, course membership model, UI labels) expects the modern
 * taxonomy, and an invitation written with a legacy value will fail
 * to resolve on acceptance.
 */
export type InvitationRole =
  | 'lead'
  | 'course_author'
  | 'problem_author'
  | 'class_coordinator'
  | 'ta'
  | 'viewer';

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'revoked'
  | 'expired';

export interface IInvitation {
  _id: string;
  /** The course the invitee will join. */
  courseId: string;
  /** Lowercased email the invite was sent to. */
  email: string;
  /** Role the invitee will have on the team. */
  role: InvitationRole;
  /** User id of the person who created the invitation. */
  invitedBy: string;
  /** SHA-256 hex of `<rawToken><pepper>`. Never returned in queries. */
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationDocument
  extends Omit<IInvitation, '_id'>,
    Document {}

const invitationSchema = new Schema<InvitationDocument>(
  {
    courseId: { type: String, required: true, index: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: [
        'lead',
        'course_author',
        'problem_author',
        'class_coordinator',
        'ta',
        'viewer',
      ] as InvitationRole[],
      required: true,
    },
    invitedBy: { type: String, required: true, index: true },
    // `select: false` keeps the hash out of every default query. The
    // only code path that needs it (resolving a token) requests it
    // explicitly with `.select('+tokenHash')`.
    tokenHash: { type: String, required: true, select: false },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'] as InvitationStatus[],
      default: 'pending',
      index: true,
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: String },
  },
  { timestamps: true }
);

// Fast lookup for the accept flow.
invitationSchema.index({ tokenHash: 1 }, { unique: true });

// Prevent duplicate pending invitations for the same (course, email).
// Partial index so past invitations don't block re-invites.
invitationSchema.index(
  { courseId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

// Bulk sweep query: "find pending invitations past their expiry".
// The job flips them to `expired` (it does NOT delete — we keep the
// audit trail).
invitationSchema.index({ status: 1, expiresAt: 1 });

export const Invitation = mongoose.model<InvitationDocument>(
  'Invitation',
  invitationSchema
);