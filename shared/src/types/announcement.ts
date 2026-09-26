/**
 * Announcements.
 *
 * Master Spec, section 43:
 *   "Announcements are messages from instructors to a target
 *    audience. Audiences are: all | roadmap | course | cohort |
 *    class."
 *
 * An Announcement is a first-class entity, not a channel on a
 * Course. The audience is a discriminated union — the `kind` field
 * determines whether `id` is present and required. This makes the
 * invalid states unrepresentable: you cannot save an announcement
 * with `kind: 'all'` and a stray id, nor with `kind: 'cohort'` and
 * no id.
 */

/**
 * The five kinds of audience. Each kind except `all` carries a
 * required `id` referencing the corresponding entity.
 */
export type AnnouncementAudience =
  | { kind: 'all' }
  | { kind: 'roadmap'; id: string }
  | { kind: 'course'; id: string }
  | { kind: 'cohort'; id: string }
  | { kind: 'class'; id: string };

export type AnnouncementAudienceKind = AnnouncementAudience['kind'];

export interface IAnnouncement {
  _id: string;
  title: string;
  /** Markdown is not supported; line breaks are preserved. */
  body: string;
  audience: AnnouncementAudience;
  authorId: string;
  publishedAt: Date;
  /**
   * When set, the announcement is pinned above others in feeds
   * until this date. `undefined` means not pinned.
   */
  pinnedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * An announcement with the author's display fields attached, for
 * feed rendering.
 */
export interface IAnnouncementWithAuthor extends IAnnouncement {
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

/**
 * The shape used by create endpoints. Deliberately excludes `_id`,
 * `publishedAt`, `createdAt`, and `updatedAt` — those are set by the
 * server.
 */
export interface ICreateAnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  /** Optional ISO string. Omit for "not pinned". */
  pinnedUntil?: string;
}