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
    role: z.enum([
      'lead',
      'course_author',
      'problem_author',
      'class_coordinator',
      'ta',
      'viewer',
    ]),
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

/**
 * Resolve the caller's effective role on a course. Throws 404 if the
 * course doesn't exist.
 */
async function resolveCourseAndRole(req: AuthRequest, slug: string) {
  const user = {
    _id: req.user!._id.toString(),
    role: req.user!.role as string,
  };
  const course = await Course.findOne({ slug });
  if (!course) throw new ApiError(404, 'Course not found.');
  const role = await permissions.resolveEffectiveRole(
    user,
    course._id.toString()
  );
  return { course, role };
}

export const instructorInvitationController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { course, role } = await resolveCourseAndRole(
      req,
      String(req.params.slug)
    );

    if (!permissions.canManageTeam(role)) {
      throw new ApiError(403, 'You do not have permission to invite members.');
    }

    const { email, role: inviteRole } = req.body;
    const { invitationId } = await invitationService.create({
      courseId: course._id.toString(),
      email,
      role: inviteRole,
      invitedBy: user._id.toString(),
    });

    return ApiResponse.success(
      res,
      { invitationId },
      'Invitation sent',
      201
    );
  }),

  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { course, role } = await resolveCourseAndRole(
      req,
      String(req.params.slug)
    );

    if (!permissions.canAccessCourse(role)) {
      throw new ApiError(403, 'You do not have access to this course.');
    }

    const invitations = await invitationService.listForCourse(
      course._id.toString()
    );
    return ApiResponse.success(res, invitations);
  }),

  revoke: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { course, role } = await resolveCourseAndRole(
      req,
      String(req.params.slug)
    );

    if (!permissions.canManageTeam(role)) {
      throw new ApiError(403, 'You do not have permission to manage invites.');
    }

    await invitationService.revoke(
      String(req.params.invitationId),
      course._id.toString()
    );
    return ApiResponse.success(res, { ok: true }, 'Invitation revoked');
  }),

  resolve: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invitation, course, isExpired, isAlreadyAccepted, isRevoked } =
      await invitationService.resolve(String(req.params.token));

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

  accept: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { courseSlug } = await invitationService.accept({
      rawToken: String(req.params.token),
      userId,
    });
    return ApiResponse.success(
      res,
      { courseSlug },
      'Invitation accepted'
    );
  }),
};