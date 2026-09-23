import mongoose, { Schema, type Document } from 'mongoose';

export type InvitationRole = 'lead' | 'author' | 'reviewer' | 'ta' | 'viewer';

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
  /** SHA-256 hex of `<pepper>${rawToken}`. */
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
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: {
      type: String,
      enum: ['lead', 'author', 'reviewer', 'ta', 'viewer'] as InvitationRole[],
      required: true,
    },
    invitedBy: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
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

// Auto-expire: mark as expired once `expiresAt` passes.
// (Mongo's TTL can delete, but we want the audit trail, so we keep
// the row and only flip the status. A periodic job handles it.)
invitationSchema.index({ status: 1, expiresAt: 1 });

export const Invitation = mongoose.model<InvitationDocument>(
  'Invitation',
  invitationSchema
);