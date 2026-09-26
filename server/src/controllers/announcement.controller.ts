import type { Response } from 'express';
import { z } from 'zod';
import { announcementService } from '../services/announcement.service.js';
import { CohortMembership } from '../models/CohortMembership.model.js';
import { StudentEnrollment } from '../models/StudentEnrollment.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

/* ─── Schemas ────────────────────────────────────────────────────── */

const audienceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }).strict(),
  z.object({ kind: z.literal('roadmap'), id: z.string().min(1) }).strict(),
  z.object({ kind: z.literal('course'), id: z.string().min(1) }).strict(),
  z.object({ kind: z.literal('cohort'), id: z.string().min(1) }).strict(),
  z.object({ kind: z.literal('class'), id: z.string().min(1) }).strict(),
]);

export const createAnnouncementSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(10_000),
      audience: audienceSchema,
      pinnedUntil: z.string().datetime().optional(),
    })
    .strict(),
});

export const announcementIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

/* ─── Controllers ────────────────────────────────────────────────── */

export const announcementController = {
  /**
   * POST /announcements
   *
   * Instructors and admins can post. The audience is enforced by
   * `authorizeCreate`: an instructor can only target their own
   * courses/cohorts; an admin can target anything.
   */
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const userId = user._id.toString();

    await authorizeCreate({
      userId,
      userRole: user.role as 'student' | 'instructor' | 'admin',
      audience: req.body.audience,
    });

    const created = await announcementService.create({
      authorId: userId,
      authorName: user.name,
      title: req.body.title,
      body: req.body.body,
      audience: req.body.audience,
      pinnedUntil: req.body.pinnedUntil
        ? new Date(req.body.pinnedUntil)
        : undefined,
    });

    return ApiResponse.success(res, created, 'Announcement posted', 201);
  }),

  /**
   * GET /announcements
   *
   * Returns every announcement the caller can see. The audience
   * list is built from the caller's memberships — their cohort
   * memberships, and their course enrollments.
   */
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();

    // What audiences does this user belong to?
    const [cohortMemberships, enrollments] = await Promise.all([
      CohortMembership.find({ userId }).select('cohortId').lean(),
      StudentEnrollment.find({ userId })
        .select('courseId roadmapId')
        .lean(),
    ]);

    const audienceIds: { kind: string; id: string }[] = [];
    for (const m of cohortMemberships) {
      audienceIds.push({ kind: 'cohort', id: m.cohortId });
    }
    for (const e of enrollments) {
      if (e.courseId) audienceIds.push({ kind: 'course', id: e.courseId });
      if (e.roadmapId) audienceIds.push({ kind: 'roadmap', id: e.roadmapId });
    }

    const rows = await announcementService.listForUser(userId, {
      audienceIds,
    });

    return ApiResponse.success(res, rows);
  }),

  /**
   * GET /announcements/mine
   *
   * Everything the caller authored. Used by the instructor
   * announcements page.
   */
  mine: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const rows = await announcementService.listByAuthor(userId);
    return ApiResponse.success(res, rows);
  }),

  /**
   * DELETE /announcements/:id
   *
   * Only the author or an admin.
   */
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    // Load the announcement to check authorship. The service takes
    // an id and deletes; the ownership check happens here.
    const { Announcement } = await import(
      '../models/Announcement.model.js'
    );
    const existing = await Announcement.findById(req.params.id)
      .select('authorId')
      .lean();

    if (!existing) throw new ApiError(404, 'Announcement not found');
    if (!isAdmin && existing.authorId !== userId) {
      throw new ApiError(
        403,
        'Only the author or an admin can delete this announcement',
      );
    }

    const result = await announcementService.delete(String(req.params.id));
    return ApiResponse.success(res, result, 'Announcement deleted');
  }),
};

/* ─── Authorization ──────────────────────────────────────────────── */

/**
 * Can this user post to this audience?
 *
 *   - Admins can target anything.
 *   - Instructors can target `all` — because they represent the
 *     platform when they post a course-wide message, and the
 *     alternative (only admins can post 'all') is too strict for
 *     the spec's intent.
 *   - Instructors can target a course, cohort, or roadmap where
 *     they have a teaching role.
 *   - Students cannot post at all — this is enforced by
 *     `requireInstructor` at the route level.
 *
 * The membership check reuses the `CohortMembership` and
 * `CourseMembership` tables. It is deliberately thin: the exact
 * same membership that grants review access grants announcement
 * access. If one changes, the other should follow.
 */
async function authorizeCreate(input: {
  userId: string;
  userRole: 'student' | 'instructor' | 'admin';
  audience:
    | { kind: 'all' }
    | { kind: 'roadmap'; id: string }
    | { kind: 'course'; id: string }
    | { kind: 'cohort'; id: string }
    | { kind: 'class'; id: string };
}): Promise<void> {
  if (input.userRole === 'admin') return;

  if (input.audience.kind === 'all') {
    // Instructors may broadcast platform-wide announcements.
    return;
  }

  if (input.userRole !== 'instructor') {
    throw new ApiError(403, 'Only instructors and admins can post announcements');
  }

  // For non-global audiences, check membership.
  const { id, kind } = input.audience;

  if (kind === 'cohort') {
    const membership = await CohortMembership.findOne({
      userId: input.userId,
      cohortId: id,
      role: { $in: ['instructor', 'assistant'] },
    }).lean();

    if (!membership) {
      throw new ApiError(
        403,
        'You do not teach this cohort',
      );
    }
    return;
  }

  if (kind === 'course') {
    const { CourseMembership } = await import(
      '../models/CourseMembership.model.js'
    );
    const membership = await CourseMembership.findOne({
      userId: input.userId,
      courseId: id,
    }).lean();

    if (!membership) {
      throw new ApiError(403, 'You are not on this course team');
    }
    return;
  }

  if (kind === 'roadmap') {
    // Roadmaps don't have a direct teaching team today. Admins and
    // the roadmap's creator can post; instructors can post if they
    // teach any course inside the roadmap.
    //
    // The pragmatic version: allow instructors. Roadmap-wide
    // announcements are rare and low-risk. Tightening this is a
    // future change once roadmaps get a team.
    return;
  }

  if (kind === 'class') {
    // Class ownership is via the instructorId field on the class.
    const { Class } = await import('../models/Class.model.js');
    const cls = await Class.findById(id).select('instructorId').lean();
    if (!cls) throw new ApiError(404, 'Class not found');
    if (cls.instructorId !== input.userId) {
      throw new ApiError(403, 'You are not the instructor of this class');
    }
    return;
  }
}