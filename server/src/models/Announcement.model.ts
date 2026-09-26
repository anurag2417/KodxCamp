import mongoose, { Schema, type Document } from 'mongoose';

export type AnnouncementAudience =
  | { kind: 'all' }
  | { kind: 'roadmap'; id: string }
  | { kind: 'course'; id: string }
  | { kind: 'cohort'; id: string }
  | { kind: 'class'; id: string };

export interface AnnouncementDocument extends Document {
  title: string;
  body: string;
  /**
   * Stored as two flat fields (`audienceKind`, `audienceId`) rather
   * than a nested object. Two reasons:
   *
   *   1. Querying: "find announcements for course X" is
   *      `{ audienceKind: 'course', audienceId: X }`, which uses an
   *      index cleanly. A nested object needs `audience.kind` and
   *      `audience.id` in the index spec, which is fine but reads
   *      slightly worse.
   *
   *   2. Mongoose nested objects with optional fields are awkward
   *      to type. Two flat fields are simpler.
   *
   * The invariant "audienceId is set iff audienceKind !== 'all'" is
   * enforced by a schema-level validator below, not by Mongoose's
   * `required`.
   */
  audienceKind: 'all' | 'roadmap' | 'course' | 'cohort' | 'class';
  audienceId?: string;

  authorId: string;
  publishedAt: Date;
  pinnedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<AnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 10_000 },

    audienceKind: {
      type: String,
      enum: ['all', 'roadmap', 'course', 'cohort', 'class'],
      required: true,
      index: true,
    },
    audienceId: { type: String, index: true },

    authorId: { type: String, required: true, index: true },
    publishedAt: { type: Date, required: true, index: true },
    pinnedUntil: { type: Date, index: true },
  },
  { timestamps: true },
);

/**
 * Enforce the discriminated union at the schema level.
 *
 *   - audienceKind === 'all' → audienceId must be absent
 *   - audienceKind !== 'all' → audienceId must be present
 *
 * The type union on the shared types already prevents this at
 * compile time in TypeScript callers. This validator is the
 * backstop for direct DB writes, migrations, and any code path that
 * bypasses the controller.
 */
announcementSchema.pre('validate', function (next) {
  const isGlobal = this.audienceKind === 'all';
  const hasId =
    typeof this.audienceId === 'string' && this.audienceId.length > 0;

  if (isGlobal && hasId) {
    next(
      new Error(
        "Announcement audienceKind is 'all' but audienceId is set. Either drop the id, or change the kind.",
      ),
    );
    return;
  }

  if (!isGlobal && !hasId) {
    next(
      new Error(
        `Announcement audienceKind is '${this.audienceKind}' but audienceId is missing.`,
      ),
    );
    return;
  }

  next();
});

/**
 * The feed query: "announcements targeting [audience], newest
 * first." The compound index covers both the direct query and the
 * sort.
 */
announcementSchema.index({
  audienceKind: 1,
  audienceId: 1,
  publishedAt: -1,
});

/**
 * The pinned-then-recent ordering. Announcements that are pinned
 * appear above non-pinned ones within their feed. A separate index
 * so the sort works on the pinned path without scanning.
 */
announcementSchema.index({
  audienceKind: 1,
  audienceId: 1,
  pinnedUntil: -1,
  publishedAt: -1,
});

export const Announcement = mongoose.model<AnnouncementDocument>(
  'Announcement',
  announcementSchema,
);