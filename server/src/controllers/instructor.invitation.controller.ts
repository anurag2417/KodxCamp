import type { Response } from 'express';
import { z } from 'zod';
import { invitationService } from '../services/invitation.service.js';
import { Course } from '../models/Course.model.js';
import { permissions } from '../services/permissions.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const createInvitationSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    email: z.string().email('Enter a valid email address'),
    role: z.enum(['lead', 'author', 'reviewer', 'ta', 'viewer']),
  }),
});

export const invitationParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    invitationId: z.string().min(1),
  }),
});

export const resolveInvitationSchema = z.object({
  params: z.object({ token: z.string().min(1) }),
});

export const acceptInvitationSchema = z.object({
  params: z.object({ token: z.string().min(1) }),
});

export const instructorInvitationController = {
  /**
   * Create a new invitation for a course.
   * Requires `canManageTeam` permission on the course.
   */
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) throw new ApiError(404, 'Course not found.');

    if (
      !permissions.canManageTeam(
        { _id: user._id.toString(), role: user.role },
        course as unknown as Parameters<typeof permissions.canManageTeam>[1]
      )
    ) {
      throw new ApiError(403, 'You do not have permission to invite members.');
    }

    const { email, role } = req.body;
    const { invitationId } = await invitationService.create({
      courseId: course._id.toString(),
      email,
      role,
      invitedBy: user._id.toString(),
    });

    return ApiResponse.success(
      res,
      { invitationId },
      'Invitation sent',
      201
    );
  }),

  /**
   * List pending and past invitations for a course.
   */
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) throw new ApiError(404, 'Course not found.');

    if (
      !permissions.canAccessCourse(
        { _id: user._id.toString(), role: user.role },
        course as unknown as Parameters<typeof permissions.canAccessCourse>[1]
      )
    ) {
      throw new ApiError(403, 'You do not have access to this course.');
    }

    const invitations = await invitationService.listForCourse(
      course._id.toString()
    );
    return ApiResponse.success(res, invitations);
  }),

  /**
   * Revoke a pending invitation.
   */
  revoke: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) throw new ApiError(404, 'Course not found.');

    if (
      !permissions.canManageTeam(
        { _id: user._id.toString(), role: user.role },
        course as unknown as Parameters<typeof permissions.canManageTeam>[1]
      )
    ) {
      throw new ApiError(403, 'You do not have permission to manage invites.');
    }

    await invitationService.revoke(
      req.params.invitationId,
      course._id.toString()
    );
    return ApiResponse.success(res, { ok: true }, 'Invitation revoked');
  }),

  /**
   * Public — resolve an invitation token so the client can show the
   * right screen ("you've been invited to X"). Does not require auth.
   */
  resolve: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invitation, course, isExpired, isAlreadyAccepted, isRevoked } =
      await invitationService.resolve(req.params.token);

    return ApiResponse.success(res, {
      invitation: {
        _id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        language: course.language,
      },
      isExpired,
      isAlreadyAccepted,
      isRevoked,
    });
  }),

  /**
   * Authenticated — accept the invitation.
   */
  accept: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { courseSlug } = await invitationService.accept({
      rawToken: req.params.token,
      userId,
    });
    return ApiResponse.success(
      res,
      { courseSlug },
      'Invitation accepted'
    );
  }),
};